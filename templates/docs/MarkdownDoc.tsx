/**
 * Markdown documentation page template
 */
import { basePath } from "../../data/docs.ts";
import { extractTitle, extractToc, parseMarkdown } from "../../lib/markdown.ts";
import { DocLayout, TableOfContents } from "../components.tsx";
import { Layout } from "../Layout.tsx";
import { mainScript } from "../scripts.ts";

interface MarkdownDocProps {
  /** Raw markdown content */
  content: string;
  /** Page title suffix (after " - Probitas Documentation") */
  titleSuffix?: string;
  /** URL path for alternate markdown link */
  markdownPath?: string;
  /** Page description for SEO and JSON-LD */
  description?: string;
}

/** Render a markdown document as a full page */
export function MarkdownDoc(
  { content, titleSuffix, markdownPath, description }: MarkdownDocProps,
) {
  // Extract title from content if not provided
  const title = titleSuffix ?? extractTitle(content) ?? "Documentation";
  const pageTitle = `${title} - Probitas Documentation`;

  // Extract table of contents from headings
  const tocItems = extractToc(content).map((item) => ({
    id: item.id,
    label: item.label,
  }));

  // Alternate markdown URL (path ends with /, so append index.md)
  const alternateMarkdown = markdownPath
    ? `${basePath}${markdownPath}index.md`
    : undefined;

  // Build header extra HTML (toolbelt with source link)
  const headerExtra = alternateMarkdown
    ? `<div class="content-toolbelt"><a href="${alternateMarkdown}" class="markdown-source-link" title="View Markdown source"><i class="ti ti-markdown"></i></a></div>`
    : undefined;

  // Parse markdown to HTML
  const html = parseMarkdown(content, headerExtra);

  return (
    <Layout
      title={pageTitle}
      alternateMarkdown={alternateMarkdown}
      description={description}
      pagePath={markdownPath}
    >
      <DocLayout
        sidebar={<TableOfContents items={tocItems} />}
      >
        <div class="content-article-container">
          <article
            class="content-article markdown-body"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </DocLayout>
      <script dangerouslySetInnerHTML={{ __html: mainScript }} />
    </Layout>
  );
}

/** Load and render a markdown file */
export async function MarkdownDocFromFile(
  filePath: string,
  titleSuffix?: string,
  markdownPath?: string,
  description?: string,
) {
  const content = await Deno.readTextFile(filePath);
  return MarkdownDoc({ content, titleSuffix, markdownPath, description });
}
