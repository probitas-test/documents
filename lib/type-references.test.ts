/**
 * Tests for type-references.ts utilities
 */
import { assertEquals } from "@std/assert";
import type {
  ClassDef,
  FunctionDef,
  InterfaceDef,
  MethodDef,
  ParamDef,
  PropertyDef,
  TsTypeDef,
  TsTypeParamDef,
} from "./api-docs.ts";
import {
  extractClassRefs,
  extractFunctionRefs,
  extractInterfaceRefs,
  extractMethodRefs,
  extractParamRefs,
  extractPropertyRefs,
  extractTypeParamRefs,
  extractTypeRefs,
} from "./type-references.ts";

// ============================================================================
// extractTypeRefs Tests
// ============================================================================

Deno.test("extractTypeRefs - returns empty set for undefined", () => {
  const refs = extractTypeRefs(undefined);
  assertEquals(refs.size, 0);
});

Deno.test("extractTypeRefs - extracts typeRef", () => {
  const type: TsTypeDef = {
    repr: "MyType",
    kind: "typeRef",
    typeRef: { typeName: "MyType", typeParams: null },
  };
  const refs = extractTypeRefs(type);
  assertEquals(refs.has("MyType"), true);
  assertEquals(refs.size, 1);
});

Deno.test("extractTypeRefs - extracts nested generic type params", () => {
  const type: TsTypeDef = {
    repr: "Promise<Response>",
    kind: "typeRef",
    typeRef: {
      typeName: "Promise",
      typeParams: [
        {
          repr: "Response",
          kind: "typeRef",
          typeRef: { typeName: "Response", typeParams: null },
        },
      ],
    },
  };
  const refs = extractTypeRefs(type);
  assertEquals(refs.has("Promise"), true);
  assertEquals(refs.has("Response"), true);
  assertEquals(refs.size, 2);
});

Deno.test("extractTypeRefs - extracts from array type", () => {
  const type: TsTypeDef = {
    repr: "User[]",
    kind: "array",
    array: {
      repr: "User",
      kind: "typeRef",
      typeRef: { typeName: "User", typeParams: null },
    },
  };
  const refs = extractTypeRefs(type);
  assertEquals(refs.has("User"), true);
});

Deno.test("extractTypeRefs - extracts from union type", () => {
  const type: TsTypeDef = {
    repr: "TypeA | TypeB",
    kind: "union",
    union: [
      {
        repr: "TypeA",
        kind: "typeRef",
        typeRef: { typeName: "TypeA", typeParams: null },
      },
      {
        repr: "TypeB",
        kind: "typeRef",
        typeRef: { typeName: "TypeB", typeParams: null },
      },
    ],
  };
  const refs = extractTypeRefs(type);
  assertEquals(refs.has("TypeA"), true);
  assertEquals(refs.has("TypeB"), true);
});

Deno.test("extractTypeRefs - extracts from intersection type", () => {
  const type: TsTypeDef = {
    repr: "TypeA & TypeB",
    kind: "intersection",
    intersection: [
      {
        repr: "TypeA",
        kind: "typeRef",
        typeRef: { typeName: "TypeA", typeParams: null },
      },
      {
        repr: "TypeB",
        kind: "typeRef",
        typeRef: { typeName: "TypeB", typeParams: null },
      },
    ],
  };
  const refs = extractTypeRefs(type);
  assertEquals(refs.has("TypeA"), true);
  assertEquals(refs.has("TypeB"), true);
});

Deno.test("extractTypeRefs - extracts from tuple type", () => {
  const type: TsTypeDef = {
    repr: "[TypeA, TypeB]",
    kind: "tuple",
    tuple: [
      {
        repr: "TypeA",
        kind: "typeRef",
        typeRef: { typeName: "TypeA", typeParams: null },
      },
      {
        repr: "TypeB",
        kind: "typeRef",
        typeRef: { typeName: "TypeB", typeParams: null },
      },
    ],
  };
  const refs = extractTypeRefs(type);
  assertEquals(refs.has("TypeA"), true);
  assertEquals(refs.has("TypeB"), true);
});

Deno.test("extractTypeRefs - extracts from function type", () => {
  const type: TsTypeDef = {
    repr: "(x: Input) => Output",
    kind: "fnOrConstructor",
    fnOrConstructor: {
      constructor: false,
      typeParams: [],
      params: [
        {
          kind: "identifier",
          name: "x",
          tsType: {
            repr: "Input",
            kind: "typeRef",
            typeRef: { typeName: "Input", typeParams: null },
          },
        },
      ],
      returnType: {
        repr: "Output",
        kind: "typeRef",
        typeRef: { typeName: "Output", typeParams: null },
      },
    },
  };
  const refs = extractTypeRefs(type);
  assertEquals(refs.has("Input"), true);
  assertEquals(refs.has("Output"), true);
});

Deno.test("extractTypeRefs - extracts from typeOperator", () => {
  const type: TsTypeDef = {
    repr: "keyof Config",
    kind: "typeOperator",
    typeOperator: {
      operator: "keyof",
      tsType: {
        repr: "Config",
        kind: "typeRef",
        typeRef: { typeName: "Config", typeParams: null },
      },
    },
  };
  const refs = extractTypeRefs(type);
  assertEquals(refs.has("Config"), true);
});

Deno.test("extractTypeRefs - extracts from typeLiteral properties", () => {
  const type: TsTypeDef = {
    repr: "{ value: TypeA }",
    kind: "typeLiteral",
    typeLiteral: {
      methods: [],
      properties: [
        {
          name: "value",
          tsType: {
            repr: "TypeA",
            kind: "typeRef",
            typeRef: { typeName: "TypeA", typeParams: null },
          },
        },
      ],
      callSignatures: [],
      indexSignatures: [],
    },
  };
  const refs = extractTypeRefs(type);
  assertEquals(refs.has("TypeA"), true);
});

Deno.test("extractTypeRefs - extracts from typeLiteral methods", () => {
  const type: TsTypeDef = {
    repr: "{ method(x: Input): Output }",
    kind: "typeLiteral",
    typeLiteral: {
      methods: [{
        name: "method",
        typeParams: [],
        params: [{
          kind: "identifier",
          name: "x",
          tsType: {
            repr: "Input",
            kind: "typeRef",
            typeRef: { typeName: "Input", typeParams: null },
          },
        }],
        returnType: {
          repr: "Output",
          kind: "typeRef",
          typeRef: { typeName: "Output", typeParams: null },
        },
      }],
      properties: [],
      callSignatures: [],
      indexSignatures: [],
    },
  };
  const refs = extractTypeRefs(type);
  assertEquals(refs.has("Input"), true);
  assertEquals(refs.has("Output"), true);
});

Deno.test("extractTypeRefs - ignores keyword types", () => {
  const type: TsTypeDef = {
    repr: "string",
    kind: "keyword",
    keyword: "string",
  };
  const refs = extractTypeRefs(type);
  assertEquals(refs.size, 0);
});

// ============================================================================
// extractTypeParamRefs Tests
// ============================================================================

Deno.test("extractTypeParamRefs - returns empty set for undefined", () => {
  const refs = extractTypeParamRefs(undefined);
  assertEquals(refs.size, 0);
});

Deno.test("extractTypeParamRefs - extracts from constraint", () => {
  const typeParams: TsTypeParamDef[] = [{
    name: "T",
    constraint: {
      repr: "BaseType",
      kind: "typeRef",
      typeRef: { typeName: "BaseType", typeParams: null },
    },
  }];
  const refs = extractTypeParamRefs(typeParams);
  assertEquals(refs.has("BaseType"), true);
});

Deno.test("extractTypeParamRefs - extracts from default", () => {
  const typeParams: TsTypeParamDef[] = [{
    name: "T",
    default: {
      repr: "DefaultType",
      kind: "typeRef",
      typeRef: { typeName: "DefaultType", typeParams: null },
    },
  }];
  const refs = extractTypeParamRefs(typeParams);
  assertEquals(refs.has("DefaultType"), true);
});

Deno.test("extractTypeParamRefs - extracts from both constraint and default", () => {
  const typeParams: TsTypeParamDef[] = [{
    name: "T",
    constraint: {
      repr: "BaseType",
      kind: "typeRef",
      typeRef: { typeName: "BaseType", typeParams: null },
    },
    default: {
      repr: "DefaultType",
      kind: "typeRef",
      typeRef: { typeName: "DefaultType", typeParams: null },
    },
  }];
  const refs = extractTypeParamRefs(typeParams);
  assertEquals(refs.has("BaseType"), true);
  assertEquals(refs.has("DefaultType"), true);
});

// ============================================================================
// extractParamRefs Tests
// ============================================================================

Deno.test("extractParamRefs - returns empty set for undefined", () => {
  const refs = extractParamRefs(undefined);
  assertEquals(refs.size, 0);
});

Deno.test("extractParamRefs - extracts from parameter types", () => {
  const params: ParamDef[] = [
    {
      kind: "identifier",
      name: "x",
      tsType: {
        repr: "TypeA",
        kind: "typeRef",
        typeRef: { typeName: "TypeA", typeParams: null },
      },
    },
    {
      kind: "identifier",
      name: "y",
      tsType: {
        repr: "TypeB",
        kind: "typeRef",
        typeRef: { typeName: "TypeB", typeParams: null },
      },
    },
  ];
  const refs = extractParamRefs(params);
  assertEquals(refs.has("TypeA"), true);
  assertEquals(refs.has("TypeB"), true);
});

Deno.test("extractParamRefs - skips params without tsType", () => {
  const params: ParamDef[] = [
    { kind: "identifier", name: "x" },
    {
      kind: "identifier",
      name: "y",
      tsType: {
        repr: "TypeB",
        kind: "typeRef",
        typeRef: { typeName: "TypeB", typeParams: null },
      },
    },
  ];
  const refs = extractParamRefs(params);
  assertEquals(refs.size, 1);
  assertEquals(refs.has("TypeB"), true);
});

// ============================================================================
// extractPropertyRefs Tests
// ============================================================================

Deno.test("extractPropertyRefs - returns empty set for undefined", () => {
  const refs = extractPropertyRefs(undefined);
  assertEquals(refs.size, 0);
});

Deno.test("extractPropertyRefs - extracts from property types", () => {
  const properties: PropertyDef[] = [
    {
      name: "prop1",
      tsType: {
        repr: "TypeA",
        kind: "typeRef",
        typeRef: { typeName: "TypeA", typeParams: null },
      },
    },
    {
      name: "prop2",
      tsType: {
        repr: "TypeB",
        kind: "typeRef",
        typeRef: { typeName: "TypeB", typeParams: null },
      },
    },
  ];
  const refs = extractPropertyRefs(properties);
  assertEquals(refs.has("TypeA"), true);
  assertEquals(refs.has("TypeB"), true);
});

// ============================================================================
// extractMethodRefs Tests
// ============================================================================

Deno.test("extractMethodRefs - returns empty set for undefined", () => {
  const refs = extractMethodRefs(undefined);
  assertEquals(refs.size, 0);
});

Deno.test("extractMethodRefs - extracts from method signatures", () => {
  const methods: MethodDef[] = [{
    name: "method",
    typeParams: [{
      name: "T",
      constraint: {
        repr: "BaseType",
        kind: "typeRef",
        typeRef: { typeName: "BaseType", typeParams: null },
      },
    }],
    params: [{
      kind: "identifier",
      name: "x",
      tsType: {
        repr: "Input",
        kind: "typeRef",
        typeRef: { typeName: "Input", typeParams: null },
      },
    }],
    returnType: {
      repr: "Output",
      kind: "typeRef",
      typeRef: { typeName: "Output", typeParams: null },
    },
  }];
  const refs = extractMethodRefs(methods);
  assertEquals(refs.has("BaseType"), true);
  assertEquals(refs.has("Input"), true);
  assertEquals(refs.has("Output"), true);
});

// ============================================================================
// extractFunctionRefs Tests
// ============================================================================

Deno.test("extractFunctionRefs - returns empty set for undefined", () => {
  const refs = extractFunctionRefs(undefined);
  assertEquals(refs.size, 0);
});

Deno.test("extractFunctionRefs - extracts all refs from function", () => {
  const def: FunctionDef = {
    params: [
      {
        kind: "identifier",
        name: "x",
        tsType: {
          repr: "Input",
          kind: "typeRef",
          typeRef: { typeName: "Input", typeParams: null },
        },
      },
    ],
    returnType: {
      repr: "Output",
      kind: "typeRef",
      typeRef: { typeName: "Output", typeParams: null },
    },
    hasBody: true,
    isAsync: false,
    isGenerator: false,
    typeParams: [
      {
        name: "T",
        constraint: {
          repr: "BaseType",
          kind: "typeRef",
          typeRef: { typeName: "BaseType", typeParams: null },
        },
      },
    ],
  };
  const refs = extractFunctionRefs(def);
  assertEquals(refs.has("BaseType"), true);
  assertEquals(refs.has("Input"), true);
  assertEquals(refs.has("Output"), true);
});

// ============================================================================
// extractClassRefs Tests
// ============================================================================

Deno.test("extractClassRefs - returns empty set for undefined", () => {
  const refs = extractClassRefs(undefined);
  assertEquals(refs.size, 0);
});

Deno.test("extractClassRefs - extracts extends", () => {
  const def: ClassDef = {
    isAbstract: false,
    constructors: [],
    properties: [],
    indexSignatures: [],
    methods: [],
    extends: "BaseClass",
    implements: [],
    typeParams: [],
    superTypeParams: [],
  };
  const refs = extractClassRefs(def);
  assertEquals(refs.has("BaseClass"), true);
});

Deno.test("extractClassRefs - extracts implements", () => {
  const def: ClassDef = {
    isAbstract: false,
    constructors: [],
    properties: [],
    indexSignatures: [],
    methods: [],
    implements: [
      {
        repr: "InterfaceA",
        kind: "typeRef",
        typeRef: { typeName: "InterfaceA", typeParams: null },
      },
      {
        repr: "InterfaceB",
        kind: "typeRef",
        typeRef: { typeName: "InterfaceB", typeParams: null },
      },
    ],
    typeParams: [],
    superTypeParams: [],
  };
  const refs = extractClassRefs(def);
  assertEquals(refs.has("InterfaceA"), true);
  assertEquals(refs.has("InterfaceB"), true);
});

Deno.test("extractClassRefs - extracts from constructor params", () => {
  const def: ClassDef = {
    isAbstract: false,
    constructors: [{
      name: "constructor",
      hasBody: true,
      params: [
        {
          kind: "identifier",
          name: "x",
          tsType: {
            repr: "ConfigType",
            kind: "typeRef",
            typeRef: { typeName: "ConfigType", typeParams: null },
          },
        },
      ],
    }],
    properties: [],
    indexSignatures: [],
    methods: [],
    implements: [],
    typeParams: [],
    superTypeParams: [],
  };
  const refs = extractClassRefs(def);
  assertEquals(refs.has("ConfigType"), true);
});

Deno.test("extractClassRefs - extracts from properties and methods", () => {
  const def: ClassDef = {
    isAbstract: false,
    constructors: [],
    properties: [
      {
        name: "prop",
        tsType: {
          repr: "PropType",
          kind: "typeRef",
          typeRef: { typeName: "PropType", typeParams: null },
        },
      },
    ],
    indexSignatures: [],
    methods: [{
      name: "method",
      typeParams: [],
      params: [],
      returnType: {
        repr: "ReturnType",
        kind: "typeRef",
        typeRef: { typeName: "ReturnType", typeParams: null },
      },
    }],
    implements: [],
    typeParams: [],
    superTypeParams: [],
  };
  const refs = extractClassRefs(def);
  assertEquals(refs.has("PropType"), true);
  assertEquals(refs.has("ReturnType"), true);
});

// ============================================================================
// extractInterfaceRefs Tests
// ============================================================================

Deno.test("extractInterfaceRefs - returns empty set for undefined", () => {
  const refs = extractInterfaceRefs(undefined);
  assertEquals(refs.size, 0);
});

Deno.test("extractInterfaceRefs - extracts extends", () => {
  const def: InterfaceDef = {
    extends: [
      {
        repr: "BaseInterface",
        kind: "typeRef",
        typeRef: { typeName: "BaseInterface", typeParams: null },
      },
    ],
    methods: [],
    properties: [],
    callSignatures: [],
    indexSignatures: [],
    typeParams: [],
  };
  const refs = extractInterfaceRefs(def);
  assertEquals(refs.has("BaseInterface"), true);
});

Deno.test("extractInterfaceRefs - extracts from call signatures", () => {
  const def: InterfaceDef = {
    extends: [],
    methods: [],
    properties: [],
    callSignatures: [{
      typeParams: [{
        name: "T",
        constraint: {
          repr: "Constraint",
          kind: "typeRef",
          typeRef: { typeName: "Constraint", typeParams: null },
        },
      }],
      params: [{
        kind: "identifier",
        name: "x",
        tsType: {
          repr: "Input",
          kind: "typeRef",
          typeRef: { typeName: "Input", typeParams: null },
        },
      }],
      returnType: {
        repr: "Output",
        kind: "typeRef",
        typeRef: { typeName: "Output", typeParams: null },
      },
    }],
    indexSignatures: [],
    typeParams: [],
  };
  const refs = extractInterfaceRefs(def);
  assertEquals(refs.has("Constraint"), true);
  assertEquals(refs.has("Input"), true);
  assertEquals(refs.has("Output"), true);
});

Deno.test("extractInterfaceRefs - extracts from index signatures", () => {
  const def: InterfaceDef = {
    extends: [],
    methods: [],
    properties: [],
    callSignatures: [],
    indexSignatures: [{
      params: [{
        kind: "identifier",
        name: "key",
        tsType: { repr: "string", kind: "keyword", keyword: "string" },
      }],
      tsType: {
        repr: "ValueType",
        kind: "typeRef",
        typeRef: { typeName: "ValueType", typeParams: null },
      },
    }],
    typeParams: [],
  };
  const refs = extractInterfaceRefs(def);
  assertEquals(refs.has("ValueType"), true);
});
