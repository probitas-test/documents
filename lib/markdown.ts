/**
 * Markdown rendering utilities
 */
import { marked, type Tokens } from "marked";

/** Generate slug from text (for heading IDs) */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/`([^`]+)`/g, "$1") // Remove inline code backticks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

// Configure marked with custom heading renderer for IDs
marked.use({
  gfm: true, // GitHub Flavored Markdown
  breaks: false,
  renderer: {
    heading(this: unknown, token: Tokens.Heading): string {
      const id = slugify(token.text);
      const text = this
        // deno-lint-ignore no-explicit-any
        ? (this as any).parser.parseInline(token.tokens)
        : token.text;
      return `<h${token.depth} id="${id}">${text}</h${token.depth}>\n`;
    },
  },
});

/** Parse markdown content to HTML */
export function parseMarkdown(content: string): string {
  return marked.parse(content, { async: false }) as string;
}

/** Read and parse a markdown file */
export async function readMarkdownFile(path: string): Promise<string> {
  const content = await Deno.readTextFile(path);
  return parseMarkdown(content);
}

/** Extract title from markdown (first h1) */
export function extractTitle(content: string): string | undefined {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1];
}

/** Extract table of contents from markdown headings (h2 only) */
export function extractToc(
  content: string,
): Array<{ id: string; label: string; level: number }> {
  const headingRegex = /^(##)\s+(.+)$/gm;
  const toc: Array<{ id: string; label: string; level: number }> = [];

  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const rawLabel = match[2];

    // Clean label for display
    const label = rawLabel
      .replace(/`([^`]+)`/g, "$1") // Remove inline code backticks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // Remove links

    // Use same slugify function as renderer
    const id = slugify(rawLabel);

    toc.push({ id, label, level });
  }

  return toc;
}
