/**
 * Tests for api-docs.ts utilities
 */
import { assertEquals } from "@std/assert";
import {
  deduplicateByName,
  type DocNode,
  formatParams,
  formatType,
  formatTypeParams,
  getDescription,
  getDescriptionSummary,
  getExamples,
  getParamDocs,
  getReturnDoc,
  getTagsByKind,
  groupByKind,
  groupByName,
  isBuiltinType,
  isPublic,
  type JsDoc,
  type ParamDef,
  type TsTypeDef,
  type TsTypeParamDef,
} from "./api-docs.ts";

// ============================================================================
// Test Helpers
// ============================================================================

function createDocNode(
  overrides: Partial<DocNode> & { name: string; kind: DocNode["kind"] },
): DocNode {
  return {
    location: { filename: "test.ts", line: 1, col: 0, byteIndex: 0 },
    declarationKind: "export",
    ...overrides,
  };
}

function createJsDoc(doc?: string, tags?: JsDoc["tags"]): JsDoc {
  return { doc, tags };
}

// ============================================================================
// formatType Tests
// ============================================================================

Deno.test("formatType - handles undefined input", () => {
  assertEquals(formatType(undefined), "unknown");
});

Deno.test("formatType - formats keyword types", () => {
  const type: TsTypeDef = {
    repr: "string",
    kind: "keyword",
    keyword: "string",
  };
  assertEquals(formatType(type), "string");
});

Deno.test("formatType - formats simple type reference", () => {
  const type: TsTypeDef = {
    repr: "Promise",
    kind: "typeRef",
    typeRef: { typeName: "Promise", typeParams: null },
  };
  assertEquals(formatType(type), "Promise");
});

Deno.test("formatType - formats generic type reference", () => {
  const type: TsTypeDef = {
    repr: "Promise<string>",
    kind: "typeRef",
    typeRef: {
      typeName: "Promise",
      typeParams: [{ repr: "string", kind: "keyword", keyword: "string" }],
    },
  };
  assertEquals(formatType(type), "Promise<string>");
});

Deno.test("formatType - formats array type", () => {
  const type: TsTypeDef = {
    repr: "string[]",
    kind: "array",
    array: { repr: "string", kind: "keyword", keyword: "string" },
  };
  assertEquals(formatType(type), "string[]");
});

Deno.test("formatType - formats union type", () => {
  const type: TsTypeDef = {
    repr: "string | number",
    kind: "union",
    union: [
      { repr: "string", kind: "keyword", keyword: "string" },
      { repr: "number", kind: "keyword", keyword: "number" },
    ],
  };
  assertEquals(formatType(type), "string | number");
});

Deno.test("formatType - formats intersection type", () => {
  const type: TsTypeDef = {
    repr: "A & B",
    kind: "intersection",
    intersection: [
      {
        repr: "A",
        kind: "typeRef",
        typeRef: { typeName: "A", typeParams: null },
      },
      {
        repr: "B",
        kind: "typeRef",
        typeRef: { typeName: "B", typeParams: null },
      },
    ],
  };
  assertEquals(formatType(type), "A & B");
});

Deno.test("formatType - formats string literal type", () => {
  const type: TsTypeDef = {
    repr: '"hello"',
    kind: "literal",
    literal: { kind: "string", string: "hello" },
  };
  assertEquals(formatType(type), '"hello"');
});

Deno.test("formatType - formats number literal type", () => {
  const type: TsTypeDef = {
    repr: "42",
    kind: "literal",
    literal: { kind: "number", number: 42 },
  };
  assertEquals(formatType(type), "42");
});

Deno.test("formatType - formats boolean literal type", () => {
  const type: TsTypeDef = {
    repr: "true",
    kind: "literal",
    literal: { kind: "boolean", boolean: true },
  };
  assertEquals(formatType(type), "true");
});

Deno.test("formatType - formats tuple type", () => {
  const type: TsTypeDef = {
    repr: "[string, number]",
    kind: "tuple",
    tuple: [
      { repr: "string", kind: "keyword", keyword: "string" },
      { repr: "number", kind: "keyword", keyword: "number" },
    ],
  };
  assertEquals(formatType(type), "[string, number]");
});

Deno.test("formatType - formats function type", () => {
  const type: TsTypeDef = {
    repr: "(x: string) => number",
    kind: "fnOrConstructor",
    fnOrConstructor: {
      constructor: false,
      typeParams: [],
      params: [{
        kind: "identifier",
        name: "x",
        tsType: { repr: "string", kind: "keyword", keyword: "string" },
      }],
      returnType: { repr: "number", kind: "keyword", keyword: "number" },
    },
  };
  assertEquals(formatType(type), "(x: string) => number");
});

Deno.test("formatType - formats type operator", () => {
  const type: TsTypeDef = {
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
  };
  assertEquals(formatType(type), "keyof T");
});

Deno.test("formatType - formats type literal", () => {
  const type: TsTypeDef = {
    repr: "{ name: string }",
    kind: "typeLiteral",
    typeLiteral: {
      methods: [],
      properties: [
        {
          name: "name",
          tsType: { repr: "string", kind: "keyword", keyword: "string" },
        },
      ],
      callSignatures: [],
      indexSignatures: [],
    },
  };
  assertEquals(formatType(type), "{ name: string }");
});

Deno.test("formatType - formats type literal with optional property", () => {
  const type: TsTypeDef = {
    repr: "{ name?: string }",
    kind: "typeLiteral",
    typeLiteral: {
      methods: [],
      properties: [
        {
          name: "name",
          optional: true,
          tsType: { repr: "string", kind: "keyword", keyword: "string" },
        },
      ],
      callSignatures: [],
      indexSignatures: [],
    },
  };
  assertEquals(formatType(type), "{ name?: string }");
});

// ============================================================================
// formatParams Tests
// ============================================================================

Deno.test("formatParams - handles undefined input", () => {
  assertEquals(formatParams(undefined), "");
});

Deno.test("formatParams - handles empty array", () => {
  assertEquals(formatParams([]), "");
});

Deno.test("formatParams - formats single parameter", () => {
  const params: ParamDef[] = [
    {
      kind: "identifier",
      name: "x",
      tsType: { repr: "string", kind: "keyword", keyword: "string" },
    },
  ];
  assertEquals(formatParams(params), "x: string");
});

Deno.test("formatParams - formats multiple parameters", () => {
  const params: ParamDef[] = [
    {
      kind: "identifier",
      name: "x",
      tsType: { repr: "string", kind: "keyword", keyword: "string" },
    },
    {
      kind: "identifier",
      name: "y",
      tsType: { repr: "number", kind: "keyword", keyword: "number" },
    },
  ];
  assertEquals(formatParams(params), "x: string, y: number");
});

Deno.test("formatParams - formats optional parameter", () => {
  const params: ParamDef[] = [
    {
      kind: "identifier",
      name: "x",
      optional: true,
      tsType: { repr: "string", kind: "keyword", keyword: "string" },
    },
  ];
  assertEquals(formatParams(params), "x?: string");
});

Deno.test("formatParams - uses underscore for unnamed parameter", () => {
  const params: ParamDef[] = [
    {
      kind: "identifier",
      tsType: { repr: "string", kind: "keyword", keyword: "string" },
    },
  ];
  assertEquals(formatParams(params), "_: string");
});

// ============================================================================
// formatTypeParams Tests
// ============================================================================

Deno.test("formatTypeParams - handles undefined input", () => {
  assertEquals(formatTypeParams(undefined), "");
});

Deno.test("formatTypeParams - handles empty array", () => {
  assertEquals(formatTypeParams([]), "");
});

Deno.test("formatTypeParams - formats single type parameter", () => {
  const typeParams: TsTypeParamDef[] = [{ name: "T" }];
  assertEquals(formatTypeParams(typeParams), "<T>");
});

Deno.test("formatTypeParams - formats multiple type parameters", () => {
  const typeParams: TsTypeParamDef[] = [{ name: "T" }, { name: "U" }];
  assertEquals(formatTypeParams(typeParams), "<T, U>");
});

Deno.test("formatTypeParams - formats type parameter with constraint", () => {
  const typeParams: TsTypeParamDef[] = [
    {
      name: "T",
      constraint: { repr: "object", kind: "keyword", keyword: "object" },
    },
  ];
  assertEquals(formatTypeParams(typeParams), "<T extends object>");
});

Deno.test("formatTypeParams - formats type parameter with default", () => {
  const typeParams: TsTypeParamDef[] = [
    {
      name: "T",
      default: { repr: "string", kind: "keyword", keyword: "string" },
    },
  ];
  assertEquals(formatTypeParams(typeParams), "<T = string>");
});

Deno.test("formatTypeParams - formats type parameter with constraint and default", () => {
  const typeParams: TsTypeParamDef[] = [
    {
      name: "T",
      constraint: { repr: "object", kind: "keyword", keyword: "object" },
      default: {
        repr: "Record<string, unknown>",
        kind: "typeRef",
        typeRef: { typeName: "Record", typeParams: null },
      },
    },
  ];
  assertEquals(formatTypeParams(typeParams), "<T extends object = Record>");
});

// ============================================================================
// JSDoc Utilities Tests
// ============================================================================

Deno.test("getDescription - returns undefined for missing jsDoc", () => {
  assertEquals(getDescription({}), undefined);
});

Deno.test("getDescription - returns doc string", () => {
  const node = { jsDoc: createJsDoc("This is a description") };
  assertEquals(getDescription(node), "This is a description");
});

Deno.test("getDescriptionSummary - returns undefined for missing jsDoc", () => {
  assertEquals(getDescriptionSummary({}), undefined);
});

Deno.test("getDescriptionSummary - returns first sentence", () => {
  const node = { jsDoc: createJsDoc("First sentence. Second sentence.") };
  assertEquals(getDescriptionSummary(node), "First sentence.");
});

Deno.test("getDescriptionSummary - returns first line if no sentence", () => {
  const node = { jsDoc: createJsDoc("First line\nSecond line") };
  assertEquals(getDescriptionSummary(node), "First line");
});

Deno.test("getTagsByKind - returns empty array for missing tags", () => {
  assertEquals(getTagsByKind({}, "example"), []);
});

Deno.test("getTagsByKind - filters tags by kind", () => {
  const node = {
    jsDoc: createJsDoc("Description", [
      { kind: "example", doc: "Example 1" },
      { kind: "param", name: "x", doc: "Parameter x" },
      { kind: "example", doc: "Example 2" },
    ]),
  };
  const examples = getTagsByKind(node, "example");
  assertEquals(examples.length, 2);
  assertEquals(examples[0].doc, "Example 1");
  assertEquals(examples[1].doc, "Example 2");
});

Deno.test("getExamples - extracts example docs", () => {
  const node = {
    jsDoc: createJsDoc("Description", [
      { kind: "example", doc: "const x = 1;" },
      { kind: "example", doc: "const y = 2;" },
    ]),
  };
  const examples = getExamples(node);
  assertEquals(examples, ["const x = 1;", "const y = 2;"]);
});

Deno.test("getExamples - filters empty examples", () => {
  const node = {
    jsDoc: createJsDoc("Description", [
      { kind: "example", doc: "const x = 1;" },
      { kind: "example", doc: "" },
      { kind: "example" },
    ]),
  };
  const examples = getExamples(node);
  assertEquals(examples, ["const x = 1;"]);
});

Deno.test("getParamDocs - returns empty map for missing tags", () => {
  const result = getParamDocs({});
  assertEquals(result.size, 0);
});

Deno.test("getParamDocs - extracts param documentation", () => {
  const node = {
    jsDoc: createJsDoc("Description", [
      { kind: "param", name: "x", doc: "First parameter" },
      { kind: "param", name: "y", doc: "Second parameter" },
    ]),
  };
  const result = getParamDocs(node);
  assertEquals(result.get("x"), "First parameter");
  assertEquals(result.get("y"), "Second parameter");
});

Deno.test("getParamDocs - skips params without name or doc", () => {
  const node = {
    jsDoc: createJsDoc("Description", [
      { kind: "param", name: "x", doc: "Valid" },
      { kind: "param", name: "y" },
      { kind: "param", doc: "Missing name" },
    ]),
  };
  const result = getParamDocs(node);
  assertEquals(result.size, 1);
  assertEquals(result.get("x"), "Valid");
});

Deno.test("getReturnDoc - returns undefined for missing return tag", () => {
  assertEquals(getReturnDoc({}), undefined);
});

Deno.test("getReturnDoc - extracts return tag", () => {
  const node = {
    jsDoc: createJsDoc("Description", [
      { kind: "return", doc: "The result" },
    ]),
  };
  assertEquals(getReturnDoc(node), "The result");
});

Deno.test("getReturnDoc - extracts returns tag", () => {
  const node = {
    jsDoc: createJsDoc("Description", [
      { kind: "returns", doc: "The result" },
    ]),
  };
  assertEquals(getReturnDoc(node), "The result");
});

// ============================================================================
// isPublic Tests
// ============================================================================

Deno.test("isPublic - returns false for underscore-prefixed names", () => {
  const node = createDocNode({ name: "_private", kind: "function" });
  assertEquals(isPublic(node), false);
});

Deno.test("isPublic - returns false for moduleDoc kind", () => {
  const node = createDocNode({ name: "", kind: "moduleDoc" });
  assertEquals(isPublic(node), false);
});

Deno.test("isPublic - returns false for @internal tag", () => {
  const node = createDocNode({
    name: "internalFn",
    kind: "function",
    jsDoc: createJsDoc("Internal function", [{ kind: "internal" }]),
  });
  assertEquals(isPublic(node), false);
});

Deno.test("isPublic - returns false for @private tag", () => {
  const node = createDocNode({
    name: "privateFn",
    kind: "function",
    jsDoc: createJsDoc("Private function", [{ kind: "private" }]),
  });
  assertEquals(isPublic(node), false);
});

Deno.test("isPublic - returns true for public function", () => {
  const node = createDocNode({
    name: "publicFn",
    kind: "function",
    jsDoc: createJsDoc("Public function"),
  });
  assertEquals(isPublic(node), true);
});

// ============================================================================
// isBuiltinType Tests
// ============================================================================

Deno.test("isBuiltinType - returns true for JavaScript primitives", () => {
  assertEquals(isBuiltinType("string"), true);
  assertEquals(isBuiltinType("number"), true);
  assertEquals(isBuiltinType("boolean"), true);
});

Deno.test("isBuiltinType - returns true for built-in objects", () => {
  assertEquals(isBuiltinType("Promise"), true);
  assertEquals(isBuiltinType("Array"), true);
  assertEquals(isBuiltinType("Map"), true);
});

Deno.test("isBuiltinType - returns true for TypeScript utility types", () => {
  assertEquals(isBuiltinType("Partial"), true);
  assertEquals(isBuiltinType("Record"), true);
  assertEquals(isBuiltinType("ReturnType"), true);
});

Deno.test("isBuiltinType - returns false for custom types", () => {
  assertEquals(isBuiltinType("MyType"), false);
  assertEquals(isBuiltinType("CustomClass"), false);
});

// ============================================================================
// groupByKind Tests
// ============================================================================

Deno.test("groupByKind - groups nodes by their kind", () => {
  const nodes: DocNode[] = [
    createDocNode({ name: "fn1", kind: "function" }),
    createDocNode({ name: "Class1", kind: "class" }),
    createDocNode({ name: "fn2", kind: "function" }),
    createDocNode({ name: "Interface1", kind: "interface" }),
  ];
  const groups = groupByKind(nodes);
  assertEquals(groups["function"]?.length, 2);
  assertEquals(groups["class"]?.length, 1);
  assertEquals(groups["interface"]?.length, 1);
});

Deno.test("groupByKind - sorts each group by name", () => {
  const nodes: DocNode[] = [
    createDocNode({ name: "zebra", kind: "function" }),
    createDocNode({ name: "apple", kind: "function" }),
    createDocNode({ name: "mango", kind: "function" }),
  ];
  const groups = groupByKind(nodes);
  assertEquals(groups["function"]?.map((n) => n.name), [
    "apple",
    "mango",
    "zebra",
  ]);
});

// ============================================================================
// deduplicateByName Tests
// ============================================================================

Deno.test("deduplicateByName - removes duplicates by kind:name", () => {
  const nodes: DocNode[] = [
    createDocNode({ name: "fn", kind: "function" }),
    createDocNode({ name: "fn", kind: "function" }),
    createDocNode({ name: "fn", kind: "function" }),
  ];
  const result = deduplicateByName(nodes);
  assertEquals(result.length, 1);
});

Deno.test("deduplicateByName - keeps first occurrence", () => {
  const node1 = createDocNode({
    name: "fn",
    kind: "function",
    jsDoc: createJsDoc("First"),
  });
  const node2 = createDocNode({
    name: "fn",
    kind: "function",
    jsDoc: createJsDoc("Second"),
  });
  const result = deduplicateByName([node1, node2]);
  assertEquals(result[0].jsDoc?.doc, "First");
});

Deno.test("deduplicateByName - keeps different kinds with same name", () => {
  const nodes: DocNode[] = [
    createDocNode({ name: "Item", kind: "interface" }),
    createDocNode({ name: "Item", kind: "typeAlias" }),
  ];
  const result = deduplicateByName(nodes);
  assertEquals(result.length, 2);
});

// ============================================================================
// groupByName Tests
// ============================================================================

Deno.test("groupByName - groups nodes by kind:name", () => {
  const nodes: DocNode[] = [
    createDocNode({
      name: "fn",
      kind: "function",
      jsDoc: createJsDoc("Overload 1"),
    }),
    createDocNode({
      name: "fn",
      kind: "function",
      jsDoc: createJsDoc("Overload 2"),
    }),
    createDocNode({ name: "other", kind: "function" }),
  ];
  const groups = groupByName(nodes);
  assertEquals(groups.get("function:fn")?.length, 2);
  assertEquals(groups.get("function:other")?.length, 1);
});
