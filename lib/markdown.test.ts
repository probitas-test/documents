/**
 * Tests for markdown.ts utilities
 */
import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  extractTitle,
  extractToc,
  parseApiMarkdown,
  parseMarkdown,
} from "./markdown.ts";

// ============================================================================
// parseMarkdown Tests
// ============================================================================

Deno.test("parseMarkdown - converts basic markdown to HTML", () => {
  const result = parseMarkdown("Hello **world**");
  assertStringIncludes(result, "<strong>world</strong>");
});

Deno.test("parseMarkdown - converts headings with IDs", () => {
  const result = parseMarkdown("# Hello World");
  assertStringIncludes(result, 'id="hello-world"');
  assertStringIncludes(result, "<h1");
  assertStringIncludes(result, "Hello World");
});

Deno.test("parseMarkdown - generates slugs without inline code backticks", () => {
  const result = parseMarkdown("## The `formatType` function");
  assertStringIncludes(result, 'id="the-formattype-function"');
});

Deno.test("parseMarkdown - generates slugs without link syntax", () => {
  const result = parseMarkdown("## See [documentation](http://example.com)");
  assertStringIncludes(result, 'id="see-documentation"');
});

Deno.test("parseMarkdown - converts code blocks", () => {
  const result = parseMarkdown("```typescript\nconst x = 1;\n```");
  assertStringIncludes(result, "<code");
  assertStringIncludes(result, "const x = 1;");
});

Deno.test("parseMarkdown - converts lists", () => {
  const result = parseMarkdown("- Item 1\n- Item 2");
  assertStringIncludes(result, "<ul>");
  assertStringIncludes(result, "<li>");
});

Deno.test("parseMarkdown - converts links", () => {
  const result = parseMarkdown("[Link](http://example.com)");
  assertStringIncludes(result, '<a href="http://example.com"');
  assertStringIncludes(result, "Link</a>");
});

// ============================================================================
// parseApiMarkdown Tests (JSDoc Links)
// ============================================================================

Deno.test("parseApiMarkdown - processes {@link TypeName} without options", () => {
  const result = parseApiMarkdown("See {@link MyType} for details");
  // Without currentPackage, it should just return the text
  assertStringIncludes(result, "MyType");
});

Deno.test("parseApiMarkdown - processes {@link TypeName} with currentPackage", () => {
  const result = parseApiMarkdown("See {@link MyType} for details", {
    currentPackage: "client-http",
  });
  assertStringIncludes(result, 'href="/api/client-http#mytype"');
  assertStringIncludes(result, "MyType</a>");
});

Deno.test("parseApiMarkdown - processes {@linkcode TypeName}", () => {
  const result = parseApiMarkdown("Use {@linkcode formatType}", {
    currentPackage: "api-docs",
  });
  assertStringIncludes(result, "<code>formatType</code>");
  assertStringIncludes(result, 'href="/api/api-docs#formattype"');
});

Deno.test("parseApiMarkdown - processes {@link TypeName description}", () => {
  const result = parseApiMarkdown("See {@link MyType the type} for details", {
    currentPackage: "test",
  });
  assertStringIncludes(result, "the type</a>");
});

Deno.test("parseApiMarkdown - processes local types", () => {
  const localTypes = new Set(["LocalType"]);
  const result = parseApiMarkdown("See {@link LocalType}", {
    localTypes,
    currentPackage: "my-package",
  });
  assertStringIncludes(result, 'href="/api/my-package#localtype"');
});

Deno.test("parseApiMarkdown - processes cross-package types", () => {
  const typeToPackage = new Map([["HttpClient", "client-http"]]);
  const result = parseApiMarkdown("See {@link HttpClient}", {
    typeToPackage,
    currentPackage: "probitas",
  });
  assertStringIncludes(result, 'href="/api/client-http#httpclient"');
});

Deno.test("parseApiMarkdown - handles multiple links in same content", () => {
  const result = parseApiMarkdown(
    "Use {@link TypeA} and {@linkcode TypeB} together",
    { currentPackage: "test" },
  );
  assertStringIncludes(result, "TypeA</a>");
  assertStringIncludes(result, "<code>TypeB</code>");
});

// ============================================================================
// extractTitle Tests
// ============================================================================

Deno.test("extractTitle - extracts first h1 heading", () => {
  const content = "# My Title\n\nSome content\n\n## Section";
  assertEquals(extractTitle(content), "My Title");
});

Deno.test("extractTitle - returns undefined for no h1", () => {
  const content = "## Only h2\n\nSome content";
  assertEquals(extractTitle(content), undefined);
});

Deno.test("extractTitle - handles h1 not at start", () => {
  const content = "Some intro text\n\n# The Title\n\nMore content";
  assertEquals(extractTitle(content), "The Title");
});

Deno.test("extractTitle - extracts only first h1", () => {
  const content = "# First Title\n\n# Second Title";
  assertEquals(extractTitle(content), "First Title");
});

// ============================================================================
// extractToc Tests
// ============================================================================

Deno.test("extractToc - extracts h2 headings", () => {
  const content = `
# Title

## Section One

Content here.

## Section Two

More content.
`;
  const toc = extractToc(content);
  assertEquals(toc.length, 2);
  assertEquals(toc[0].label, "Section One");
  assertEquals(toc[0].id, "section-one");
  assertEquals(toc[0].level, 2);
  assertEquals(toc[1].label, "Section Two");
});

Deno.test("extractToc - ignores h1 and h3+ headings", () => {
  const content = `
# H1 Title

## H2 Section

### H3 Subsection

#### H4 Deep
`;
  const toc = extractToc(content);
  assertEquals(toc.length, 1);
  assertEquals(toc[0].label, "H2 Section");
});

Deno.test("extractToc - strips inline code from labels", () => {
  const content = "## The `formatType` function";
  const toc = extractToc(content);
  assertEquals(toc[0].label, "The formatType function");
  assertEquals(toc[0].id, "the-formattype-function");
});

Deno.test("extractToc - strips links from labels", () => {
  const content = "## See [docs](http://example.com) here";
  const toc = extractToc(content);
  assertEquals(toc[0].label, "See docs here");
});

Deno.test("extractToc - returns empty array for no h2 headings", () => {
  const content = "# Only H1\n\nSome content";
  const toc = extractToc(content);
  assertEquals(toc.length, 0);
});

Deno.test("extractToc - handles special characters in slugs", () => {
  const content = "## Hello, World! (2024)";
  const toc = extractToc(content);
  assertEquals(toc[0].id, "hello-world-2024");
});
