/**
 * Markdown documentation page template
 */
import { extractTitle, extractToc, parseMarkdown } from "../../lib/markdown.ts";
import { DocLayout, TableOfContents } from "../components.tsx";
import { Layout } from "../Layout.tsx";
import { mainScript } from "../scripts.ts";

interface MarkdownDocProps {
  /** Raw markdown content */
  content: string;
  /** Page title suffix (after " - Probitas Documentation") */
  titleSuffix?: string;
}

/** Render a markdown document as a full page */
export function MarkdownDoc({ content, titleSuffix }: MarkdownDocProps) {
  // Extract title from content if not provided
  const title = titleSuffix ?? extractTitle(content) ?? "Documentation";
  const pageTitle = `${title} - Probitas Documentation`;

  // Extract table of contents from headings
  const tocItems = extractToc(content).map((item) => ({
    id: item.id,
    label: item.label,
  }));

  // Parse markdown to HTML
  const html = parseMarkdown(content);

  return (
    <Layout title={pageTitle}>
      <DocLayout
        sidebar={<TableOfContents items={tocItems} />}
      >
        <article
          class="doc-article markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </DocLayout>
      <script dangerouslySetInnerHTML={{ __html: mainScript }} />
    </Layout>
  );
}

/** Load and render a markdown file */
export async function MarkdownDocFromFile(
  filePath: string,
  titleSuffix?: string,
) {
  const content = await Deno.readTextFile(filePath);
  return MarkdownDoc({ content, titleSuffix });
}
