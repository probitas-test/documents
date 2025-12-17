/**
 * Tests for signature-formatters.ts utilities
 */
import { assertEquals } from "@std/assert";
import type {
  ClassDef,
  FunctionDef,
  InterfaceDef,
  MethodDef,
  ParamDef,
  TypeAliasDef,
} from "./api-docs.ts";
import {
  formatClassSignature,
  formatConstructorSignature,
  formatFunctionSignature,
  formatInterfaceSignature,
  formatMethodSignature,
  formatTypeAliasSignature,
} from "./signature-formatters.ts";

// ============================================================================
// formatFunctionSignature Tests
// ============================================================================

Deno.test("formatFunctionSignature - formats simple function", () => {
  const def: FunctionDef = {
    params: [],
    hasBody: true,
    isAsync: false,
    isGenerator: false,
    typeParams: [],
  };
  assertEquals(
    formatFunctionSignature("myFn", def),
    "function myFn(): unknown",
  );
});

Deno.test("formatFunctionSignature - formats async function", () => {
  const def: FunctionDef = {
    params: [],
    returnType: {
      repr: "Promise<void>",
      kind: "typeRef",
      typeRef: {
        typeName: "Promise",
        typeParams: [{ repr: "void", kind: "keyword", keyword: "void" }],
      },
    },
    hasBody: true,
    isAsync: true,
    isGenerator: false,
    typeParams: [],
  };
  assertEquals(
    formatFunctionSignature("fetchData", def),
    "async function fetchData(): Promise<void>",
  );
});

Deno.test("formatFunctionSignature - formats generator function", () => {
  const def: FunctionDef = {
    params: [],
    returnType: {
      repr: "Generator<number>",
      kind: "typeRef",
      typeRef: { typeName: "Generator", typeParams: null },
    },
    hasBody: true,
    isAsync: false,
    isGenerator: true,
    typeParams: [],
  };
  assertEquals(
    formatFunctionSignature("generate", def),
    "function *generate(): Generator",
  );
});

Deno.test("formatFunctionSignature - formats function with parameters", () => {
  const def: FunctionDef = {
    params: [
      {
        kind: "identifier",
        name: "x",
        tsType: { repr: "number", kind: "keyword", keyword: "number" },
      },
      {
        kind: "identifier",
        name: "y",
        tsType: { repr: "number", kind: "keyword", keyword: "number" },
      },
    ],
    returnType: { repr: "number", kind: "keyword", keyword: "number" },
    hasBody: true,
    isAsync: false,
    isGenerator: false,
    typeParams: [],
  };
  assertEquals(
    formatFunctionSignature("add", def),
    "function add(x: number, y: number): number",
  );
});

Deno.test("formatFunctionSignature - formats function with type parameters", () => {
  const def: FunctionDef = {
    params: [
      {
        kind: "identifier",
        name: "value",
        tsType: {
          repr: "T",
          kind: "typeRef",
          typeRef: { typeName: "T", typeParams: null },
        },
      },
    ],
    returnType: {
      repr: "T",
      kind: "typeRef",
      typeRef: { typeName: "T", typeParams: null },
    },
    hasBody: true,
    isAsync: false,
    isGenerator: false,
    typeParams: [{ name: "T" }],
  };
  assertEquals(
    formatFunctionSignature("identity", def),
    "function identity<T>(value: T): T",
  );
});

Deno.test("formatFunctionSignature - formats function with constrained type parameter", () => {
  const def: FunctionDef = {
    params: [
      {
        kind: "identifier",
        name: "obj",
        tsType: {
          repr: "T",
          kind: "typeRef",
          typeRef: { typeName: "T", typeParams: null },
        },
      },
    ],
    returnType: {
      repr: "T",
      kind: "typeRef",
      typeRef: { typeName: "T", typeParams: null },
    },
    hasBody: true,
    isAsync: false,
    isGenerator: false,
    typeParams: [{
      name: "T",
      constraint: { repr: "object", kind: "keyword", keyword: "object" },
    }],
  };
  assertEquals(
    formatFunctionSignature("clone", def),
    "function clone<T extends object>(obj: T): T",
  );
});

// ============================================================================
// formatMethodSignature Tests
// ============================================================================

Deno.test("formatMethodSignature - formats simple method", () => {
  const method: MethodDef = {
    name: "getName",
    typeParams: [],
    params: [],
    returnType: { repr: "string", kind: "keyword", keyword: "string" },
  };
  assertEquals(formatMethodSignature(method), "getName(): string");
});

Deno.test("formatMethodSignature - formats static method", () => {
  const method: MethodDef = {
    name: "create",
    isStatic: true,
    typeParams: [],
    params: [],
    returnType: {
      repr: "Instance",
      kind: "typeRef",
      typeRef: { typeName: "Instance", typeParams: null },
    },
  };
  assertEquals(formatMethodSignature(method), "static create(): Instance");
});

Deno.test("formatMethodSignature - formats abstract method", () => {
  const method: MethodDef = {
    name: "process",
    isAbstract: true,
    typeParams: [],
    params: [],
    returnType: { repr: "void", kind: "keyword", keyword: "void" },
  };
  assertEquals(formatMethodSignature(method), "abstract process(): void");
});

Deno.test("formatMethodSignature - formats static abstract method", () => {
  const method: MethodDef = {
    name: "getInstance",
    isStatic: true,
    isAbstract: true,
    typeParams: [],
    params: [],
  };
  assertEquals(
    formatMethodSignature(method),
    "static abstract getInstance(): unknown",
  );
});

Deno.test("formatMethodSignature - formats method with parameters", () => {
  const method: MethodDef = {
    name: "setValues",
    typeParams: [],
    params: [
      {
        kind: "identifier",
        name: "a",
        tsType: { repr: "number", kind: "keyword", keyword: "number" },
      },
      {
        kind: "identifier",
        name: "b",
        tsType: { repr: "number", kind: "keyword", keyword: "number" },
      },
    ],
    returnType: { repr: "void", kind: "keyword", keyword: "void" },
  };
  assertEquals(
    formatMethodSignature(method),
    "setValues(a: number, b: number): void",
  );
});

Deno.test("formatMethodSignature - formats generic method", () => {
  const method: MethodDef = {
    name: "map",
    typeParams: [{ name: "U" }],
    params: [
      {
        kind: "identifier",
        name: "fn",
        tsType: {
          repr: "(value: T) => U",
          kind: "fnOrConstructor",
          fnOrConstructor: {
            constructor: false,
            typeParams: [],
            params: [{
              kind: "identifier",
              name: "value",
              tsType: {
                repr: "T",
                kind: "typeRef",
                typeRef: { typeName: "T", typeParams: null },
              },
            }],
            returnType: {
              repr: "U",
              kind: "typeRef",
              typeRef: { typeName: "U", typeParams: null },
            },
          },
        },
      },
    ],
    returnType: {
      repr: "U",
      kind: "typeRef",
      typeRef: { typeName: "U", typeParams: null },
    },
  };
  assertEquals(formatMethodSignature(method), "map<U>(fn: (value: T) => U): U");
});

// ============================================================================
// formatClassSignature Tests
// ============================================================================

Deno.test("formatClassSignature - formats simple class", () => {
  const def: ClassDef = {
    isAbstract: false,
    constructors: [],
    properties: [],
    indexSignatures: [],
    methods: [],
    implements: [],
    typeParams: [],
    superTypeParams: [],
  };
  assertEquals(formatClassSignature("MyClass", def), "class MyClass");
});

Deno.test("formatClassSignature - formats abstract class", () => {
  const def: ClassDef = {
    isAbstract: true,
    constructors: [],
    properties: [],
    indexSignatures: [],
    methods: [],
    implements: [],
    typeParams: [],
    superTypeParams: [],
  };
  assertEquals(
    formatClassSignature("AbstractBase", def),
    "abstract class AbstractBase",
  );
});

Deno.test("formatClassSignature - formats class with extends", () => {
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
  assertEquals(
    formatClassSignature("Child", def),
    "class Child extends BaseClass",
  );
});

Deno.test("formatClassSignature - formats class with extends and super type params", () => {
  const def: ClassDef = {
    isAbstract: false,
    constructors: [],
    properties: [],
    indexSignatures: [],
    methods: [],
    extends: "BaseClass",
    implements: [],
    typeParams: [],
    superTypeParams: [
      { repr: "string", kind: "keyword", keyword: "string" },
    ],
  };
  assertEquals(
    formatClassSignature("StringChild", def),
    "class StringChild extends BaseClass<string>",
  );
});

Deno.test("formatClassSignature - formats class with implements", () => {
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
  assertEquals(
    formatClassSignature("Implementation", def),
    "class Implementation implements InterfaceA, InterfaceB",
  );
});

Deno.test("formatClassSignature - formats generic class", () => {
  const def: ClassDef = {
    isAbstract: false,
    constructors: [],
    properties: [],
    indexSignatures: [],
    methods: [],
    implements: [],
    typeParams: [{ name: "T" }, { name: "U" }],
    superTypeParams: [],
  };
  assertEquals(formatClassSignature("Container", def), "class Container<T, U>");
});

Deno.test("formatClassSignature - formats complete class signature", () => {
  const def: ClassDef = {
    isAbstract: true,
    constructors: [],
    properties: [],
    indexSignatures: [],
    methods: [],
    extends: "Base",
    implements: [
      {
        repr: "Serializable",
        kind: "typeRef",
        typeRef: { typeName: "Serializable", typeParams: null },
      },
    ],
    typeParams: [{
      name: "T",
      constraint: { repr: "object", kind: "keyword", keyword: "object" },
    }],
    superTypeParams: [{
      repr: "T",
      kind: "typeRef",
      typeRef: { typeName: "T", typeParams: null },
    }],
  };
  assertEquals(
    formatClassSignature("AdvancedClass", def),
    "abstract class AdvancedClass<T extends object> extends Base<T> implements Serializable",
  );
});

// ============================================================================
// formatInterfaceSignature Tests
// ============================================================================

Deno.test("formatInterfaceSignature - formats simple interface", () => {
  const def: InterfaceDef = {
    extends: [],
    methods: [],
    properties: [],
    callSignatures: [],
    indexSignatures: [],
    typeParams: [],
  };
  assertEquals(
    formatInterfaceSignature("MyInterface", def),
    "interface MyInterface",
  );
});

Deno.test("formatInterfaceSignature - formats interface with extends", () => {
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
  assertEquals(
    formatInterfaceSignature("ExtendedInterface", def),
    "interface ExtendedInterface extends BaseInterface",
  );
});

Deno.test("formatInterfaceSignature - formats interface with multiple extends", () => {
  const def: InterfaceDef = {
    extends: [
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
    methods: [],
    properties: [],
    callSignatures: [],
    indexSignatures: [],
    typeParams: [],
  };
  assertEquals(
    formatInterfaceSignature("Combined", def),
    "interface Combined extends InterfaceA, InterfaceB",
  );
});

Deno.test("formatInterfaceSignature - formats generic interface", () => {
  const def: InterfaceDef = {
    extends: [],
    methods: [],
    properties: [],
    callSignatures: [],
    indexSignatures: [],
    typeParams: [{ name: "T" }],
  };
  assertEquals(
    formatInterfaceSignature("Container", def),
    "interface Container<T>",
  );
});

// ============================================================================
// formatTypeAliasSignature Tests
// ============================================================================

Deno.test("formatTypeAliasSignature - formats simple type alias", () => {
  const def: TypeAliasDef = {
    typeParams: [],
    tsType: { repr: "string", kind: "keyword", keyword: "string" },
  };
  assertEquals(
    formatTypeAliasSignature("StringAlias", def),
    "type StringAlias = string",
  );
});

Deno.test("formatTypeAliasSignature - formats union type alias", () => {
  const def: TypeAliasDef = {
    typeParams: [],
    tsType: {
      repr: "string | number",
      kind: "union",
      union: [
        { repr: "string", kind: "keyword", keyword: "string" },
        { repr: "number", kind: "keyword", keyword: "number" },
      ],
    },
  };
  assertEquals(
    formatTypeAliasSignature("StringOrNumber", def),
    "type StringOrNumber = string | number",
  );
});

Deno.test("formatTypeAliasSignature - formats generic type alias", () => {
  const def: TypeAliasDef = {
    typeParams: [{ name: "T" }],
    tsType: {
      repr: "T | null",
      kind: "union",
      union: [
        {
          repr: "T",
          kind: "typeRef",
          typeRef: { typeName: "T", typeParams: null },
        },
        { repr: "null", kind: "keyword", keyword: "null" },
      ],
    },
  };
  assertEquals(
    formatTypeAliasSignature("Nullable", def),
    "type Nullable<T> = T | null",
  );
});

Deno.test("formatTypeAliasSignature - formats type alias with constrained type param", () => {
  const def: TypeAliasDef = {
    typeParams: [{
      name: "T",
      constraint: { repr: "object", kind: "keyword", keyword: "object" },
    }],
    tsType: {
      repr: "keyof T",
      kind: "typeOperator",
      typeOperator: {
        operator: "keyof",
        tsType: {
          repr: "T",
          kind: "typeRef",
          typeRef: { typeName: "T", typeParams: null },
        },
      },
    },
  };
  assertEquals(
    formatTypeAliasSignature("Keys", def),
    "type Keys<T extends object> = keyof T",
  );
});

// ============================================================================
// formatConstructorSignature Tests
// ============================================================================

Deno.test("formatConstructorSignature - formats constructor without params", () => {
  const params: ParamDef[] = [];
  assertEquals(formatConstructorSignature("MyClass", params), "new MyClass()");
});

Deno.test("formatConstructorSignature - formats constructor with params", () => {
  const params: ParamDef[] = [
    {
      kind: "identifier",
      name: "name",
      tsType: { repr: "string", kind: "keyword", keyword: "string" },
    },
    {
      kind: "identifier",
      name: "age",
      tsType: { repr: "number", kind: "keyword", keyword: "number" },
    },
  ];
  assertEquals(
    formatConstructorSignature("Person", params),
    "new Person(name: string, age: number)",
  );
});

Deno.test("formatConstructorSignature - formats constructor with optional params", () => {
  const params: ParamDef[] = [
    {
      kind: "identifier",
      name: "config",
      optional: true,
      tsType: {
        repr: "Config",
        kind: "typeRef",
        typeRef: { typeName: "Config", typeParams: null },
      },
    },
  ];
  assertEquals(
    formatConstructorSignature("Service", params),
    "new Service(config?: Config)",
  );
});
