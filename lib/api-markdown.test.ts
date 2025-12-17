/**
 * Tests for api-markdown.ts utilities
 */
import { assertEquals, assertStringIncludes } from "@std/assert";
import type { DocNode, PackageDoc } from "./api-docs.ts";
import { generateApiMarkdown } from "./api-markdown.ts";

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

function createPackageDoc(overrides: Partial<PackageDoc> = {}): PackageDoc {
  return {
    name: "test-package",
    specifier: "@probitas/test-package",
    version: "1.0.0",
    exports: [],
    generatedAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

// ============================================================================
// generateApiMarkdown Tests
// ============================================================================

Deno.test("generateApiMarkdown - generates package header", () => {
  const pkg = createPackageDoc({ name: "my-package", version: "2.0.0" });
  const result = generateApiMarkdown(pkg);

  assertStringIncludes(result, "# @probitas/my-package");
  assertStringIncludes(result, "Version: 2.0.0");
});

Deno.test("generateApiMarkdown - includes module documentation", () => {
  const pkg = createPackageDoc({
    moduleDoc: "This is the module documentation.",
  });
  const result = generateApiMarkdown(pkg);

  assertStringIncludes(result, "This is the module documentation.");
});

Deno.test("generateApiMarkdown - generates function documentation", () => {
  const pkg = createPackageDoc({
    exports: [
      createDocNode({
        name: "myFunction",
        kind: "function",
        jsDoc: { doc: "Does something useful." },
        functionDef: {
          params: [
            {
              kind: "identifier",
              name: "input",
              tsType: { repr: "string", kind: "keyword", keyword: "string" },
            },
          ],
          returnType: { repr: "number", kind: "keyword", keyword: "number" },
          hasBody: true,
          isAsync: false,
          isGenerator: false,
          typeParams: [],
        },
      }),
    ],
  });
  const result = generateApiMarkdown(pkg);

  assertStringIncludes(result, "## Functions");
  assertStringIncludes(result, "### `myFunction`");
  assertStringIncludes(result, "function myFunction(input: string): number");
  assertStringIncludes(result, "Does something useful.");
});

Deno.test("generateApiMarkdown - generates class documentation", () => {
  const pkg = createPackageDoc({
    exports: [
      createDocNode({
        name: "MyClass",
        kind: "class",
        jsDoc: { doc: "A useful class." },
        classDef: {
          isAbstract: false,
          constructors: [{
            name: "constructor",
            hasBody: true,
            params: [
              {
                kind: "identifier",
                name: "config",
                tsType: {
                  repr: "Config",
                  kind: "typeRef",
                  typeRef: { typeName: "Config", typeParams: null },
                },
              },
            ],
          }],
          properties: [
            {
              name: "value",
              tsType: { repr: "string", kind: "keyword", keyword: "string" },
            },
          ],
          indexSignatures: [],
          methods: [{
            name: "getValue",
            typeParams: [],
            params: [],
            returnType: { repr: "string", kind: "keyword", keyword: "string" },
          }],
          implements: [],
          typeParams: [],
          superTypeParams: [],
        },
      }),
    ],
  });
  const result = generateApiMarkdown(pkg);

  assertStringIncludes(result, "## Classes");
  assertStringIncludes(result, "### `MyClass`");
  assertStringIncludes(result, "class MyClass");
  assertStringIncludes(result, "A useful class.");
  assertStringIncludes(result, "**Constructor:**");
  assertStringIncludes(result, "new MyClass(config: Config)");
  assertStringIncludes(result, "**Properties:**");
  assertStringIncludes(result, "`value`: `string`");
  assertStringIncludes(result, "**Methods:**");
  assertStringIncludes(result, "getValue(): string");
});

Deno.test("generateApiMarkdown - generates interface documentation", () => {
  const pkg = createPackageDoc({
    exports: [
      createDocNode({
        name: "MyInterface",
        kind: "interface",
        jsDoc: { doc: "Interface description." },
        interfaceDef: {
          extends: [],
          methods: [],
          properties: [
            {
              name: "id",
              tsType: { repr: "number", kind: "keyword", keyword: "number" },
            },
            {
              name: "name",
              optional: true,
              tsType: { repr: "string", kind: "keyword", keyword: "string" },
            },
          ],
          callSignatures: [],
          indexSignatures: [],
          typeParams: [],
        },
      }),
    ],
  });
  const result = generateApiMarkdown(pkg);

  assertStringIncludes(result, "## Interfaces");
  assertStringIncludes(result, "### `MyInterface`");
  assertStringIncludes(result, "interface MyInterface");
  assertStringIncludes(result, "`id`: `number`");
  assertStringIncludes(result, "`name?`: `string`");
});

Deno.test("generateApiMarkdown - generates type alias documentation", () => {
  const pkg = createPackageDoc({
    exports: [
      createDocNode({
        name: "StringOrNumber",
        kind: "typeAlias",
        jsDoc: { doc: "A union type." },
        typeAliasDef: {
          typeParams: [],
          tsType: {
            repr: "string | number",
            kind: "union",
            union: [
              { repr: "string", kind: "keyword", keyword: "string" },
              { repr: "number", kind: "keyword", keyword: "number" },
            ],
          },
        },
      }),
    ],
  });
  const result = generateApiMarkdown(pkg);

  assertStringIncludes(result, "## Types");
  assertStringIncludes(result, "### `StringOrNumber`");
  assertStringIncludes(result, "type StringOrNumber = string | number");
});

Deno.test("generateApiMarkdown - generates variable documentation", () => {
  const pkg = createPackageDoc({
    exports: [
      createDocNode({
        name: "DEFAULT_VALUE",
        kind: "variable",
        jsDoc: { doc: "The default value." },
        variableDef: {
          kind: "const",
          tsType: { repr: "number", kind: "keyword", keyword: "number" },
        },
      }),
    ],
  });
  const result = generateApiMarkdown(pkg);

  assertStringIncludes(result, "## Variables");
  assertStringIncludes(result, "### `DEFAULT_VALUE`");
  assertStringIncludes(result, "const DEFAULT_VALUE: number");
});

Deno.test("generateApiMarkdown - excludes private items", () => {
  const pkg = createPackageDoc({
    exports: [
      createDocNode({
        name: "_privateFunction",
        kind: "function",
        functionDef: {
          params: [],
          hasBody: true,
          isAsync: false,
          isGenerator: false,
          typeParams: [],
        },
      }),
      createDocNode({
        name: "publicFunction",
        kind: "function",
        functionDef: {
          params: [],
          hasBody: true,
          isAsync: false,
          isGenerator: false,
          typeParams: [],
        },
      }),
    ],
  });
  const result = generateApiMarkdown(pkg);

  assertEquals(result.includes("_privateFunction"), false);
  assertStringIncludes(result, "publicFunction");
});

Deno.test("generateApiMarkdown - excludes items with @internal tag", () => {
  const pkg = createPackageDoc({
    exports: [
      createDocNode({
        name: "internalFunction",
        kind: "function",
        jsDoc: { tags: [{ kind: "internal" }] },
        functionDef: {
          params: [],
          hasBody: true,
          isAsync: false,
          isGenerator: false,
          typeParams: [],
        },
      }),
      createDocNode({
        name: "publicFunction",
        kind: "function",
        functionDef: {
          params: [],
          hasBody: true,
          isAsync: false,
          isGenerator: false,
          typeParams: [],
        },
      }),
    ],
  });
  const result = generateApiMarkdown(pkg);

  assertEquals(result.includes("internalFunction"), false);
  assertStringIncludes(result, "publicFunction");
});

Deno.test("generateApiMarkdown - handles overloaded functions", () => {
  const pkg = createPackageDoc({
    exports: [
      createDocNode({
        name: "parse",
        kind: "function",
        jsDoc: { doc: "Parse a string." },
        functionDef: {
          params: [{
            kind: "identifier",
            name: "input",
            tsType: { repr: "string", kind: "keyword", keyword: "string" },
          }],
          returnType: { repr: "number", kind: "keyword", keyword: "number" },
          hasBody: true,
          isAsync: false,
          isGenerator: false,
          typeParams: [],
        },
      }),
      createDocNode({
        name: "parse",
        kind: "function",
        jsDoc: { doc: "Parse an array." },
        functionDef: {
          params: [{
            kind: "identifier",
            name: "input",
            tsType: {
              repr: "string[]",
              kind: "array",
              array: { repr: "string", kind: "keyword", keyword: "string" },
            },
          }],
          returnType: {
            repr: "number[]",
            kind: "array",
            array: { repr: "number", kind: "keyword", keyword: "number" },
          },
          hasBody: true,
          isAsync: false,
          isGenerator: false,
          typeParams: [],
        },
      }),
    ],
  });
  const result = generateApiMarkdown(pkg);

  assertStringIncludes(result, "`parse` (2 overloads)");
  assertStringIncludes(result, "**Overload 1:**");
  assertStringIncludes(result, "**Overload 2:**");
});

Deno.test("generateApiMarkdown - generates Related Links section with builtin types", () => {
  const pkg = createPackageDoc({
    exports: [
      createDocNode({
        name: "fetchData",
        kind: "function",
        functionDef: {
          params: [],
          returnType: {
            repr: "Promise<string>",
            kind: "typeRef",
            typeRef: {
              typeName: "Promise",
              typeParams: [{
                repr: "string",
                kind: "keyword",
                keyword: "string",
              }],
            },
          },
          hasBody: true,
          isAsync: true,
          isGenerator: false,
          typeParams: [],
        },
      }),
    ],
  });
  const result = generateApiMarkdown(pkg);

  assertStringIncludes(result, "## Related Links");
  assertStringIncludes(result, "### Built-in Types");
  assertStringIncludes(result, "`Promise`");
  assertStringIncludes(result, "developer.mozilla.org");
});

Deno.test("generateApiMarkdown - generates cross-package links", () => {
  const mainPkg = createPackageDoc({
    name: "main",
    exports: [
      createDocNode({
        name: "useClient",
        kind: "function",
        functionDef: {
          params: [
            {
              kind: "identifier",
              name: "client",
              tsType: {
                repr: "HttpClient",
                kind: "typeRef",
                typeRef: { typeName: "HttpClient", typeParams: null },
              },
            },
          ],
          hasBody: true,
          isAsync: false,
          isGenerator: false,
          typeParams: [],
        },
      }),
    ],
  });

  const otherPkg = createPackageDoc({
    name: "client-http",
    exports: [
      createDocNode({
        name: "HttpClient",
        kind: "class",
        classDef: {
          isAbstract: false,
          constructors: [],
          properties: [],
          indexSignatures: [],
          methods: [],
          implements: [],
          typeParams: [],
          superTypeParams: [],
        },
      }),
    ],
  });

  const result = generateApiMarkdown(mainPkg, {
    allPackages: [mainPkg, otherPkg],
  });

  assertStringIncludes(result, "### Other Packages");
  assertStringIncludes(result, "`HttpClient`");
  assertStringIncludes(result, "@probitas/client-http");
});

Deno.test("generateApiMarkdown - generates local type links", () => {
  const pkg = createPackageDoc({
    exports: [
      createDocNode({
        name: "Config",
        kind: "interface",
        interfaceDef: {
          extends: [],
          methods: [],
          properties: [
            {
              name: "timeout",
              tsType: { repr: "number", kind: "keyword", keyword: "number" },
            },
          ],
          callSignatures: [],
          indexSignatures: [],
          typeParams: [],
        },
      }),
      createDocNode({
        name: "createClient",
        kind: "function",
        functionDef: {
          params: [
            {
              kind: "identifier",
              name: "config",
              tsType: {
                repr: "Config",
                kind: "typeRef",
                typeRef: { typeName: "Config", typeParams: null },
              },
            },
          ],
          hasBody: true,
          isAsync: false,
          isGenerator: false,
          typeParams: [],
        },
      }),
    ],
  });
  const result = generateApiMarkdown(pkg);

  assertStringIncludes(result, "### This Package");
  assertStringIncludes(result, "`Config`");
});

Deno.test("generateApiMarkdown - includes generation timestamp", () => {
  const pkg = createPackageDoc({
    generatedAt: "2024-03-15T10:30:00Z",
  });
  const result = generateApiMarkdown(pkg);

  assertStringIncludes(result, "*Generated at: 2024-03-15T10:30:00Z*");
});

Deno.test("generateApiMarkdown - includes examples from JSDoc", () => {
  const pkg = createPackageDoc({
    exports: [
      createDocNode({
        name: "add",
        kind: "function",
        jsDoc: {
          doc: "Adds two numbers.",
          tags: [
            {
              kind: "example",
              doc: "```typescript\nadd(1, 2); // returns 3\n```",
            },
          ],
        },
        functionDef: {
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
          returnType: { repr: "number", kind: "keyword", keyword: "number" },
          hasBody: true,
          isAsync: false,
          isGenerator: false,
          typeParams: [],
        },
      }),
    ],
  });
  const result = generateApiMarkdown(pkg);

  assertStringIncludes(result, "**Example:**");
  assertStringIncludes(result, "add(1, 2); // returns 3");
});

Deno.test("generateApiMarkdown - includes parameter documentation", () => {
  const pkg = createPackageDoc({
    exports: [
      createDocNode({
        name: "greet",
        kind: "function",
        jsDoc: {
          doc: "Greets a person.",
          tags: [
            { kind: "param", name: "name", doc: "The person's name" },
            { kind: "param", name: "age", doc: "The person's age" },
          ],
        },
        functionDef: {
          params: [
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
          ],
          returnType: { repr: "string", kind: "keyword", keyword: "string" },
          hasBody: true,
          isAsync: false,
          isGenerator: false,
          typeParams: [],
        },
      }),
    ],
  });
  const result = generateApiMarkdown(pkg);

  assertStringIncludes(result, "**Parameters:**");
  assertStringIncludes(result, "`name`: `string`");
  assertStringIncludes(result, "The person's name");
  assertStringIncludes(result, "`age`: `number`");
  assertStringIncludes(result, "The person's age");
});

Deno.test("generateApiMarkdown - includes return documentation", () => {
  const pkg = createPackageDoc({
    exports: [
      createDocNode({
        name: "calculate",
        kind: "function",
        jsDoc: {
          doc: "Calculates something.",
          tags: [
            { kind: "returns", doc: "The calculated result" },
          ],
        },
        functionDef: {
          params: [],
          returnType: { repr: "number", kind: "keyword", keyword: "number" },
          hasBody: true,
          isAsync: false,
          isGenerator: false,
          typeParams: [],
        },
      }),
    ],
  });
  const result = generateApiMarkdown(pkg);

  assertStringIncludes(result, "**Returns:** `number`");
  assertStringIncludes(result, "The calculated result");
});
