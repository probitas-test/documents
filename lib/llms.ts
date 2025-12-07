/**
 * LLM-friendly content generation for AI agents and tools
 *
 * Implements the llms.txt standard: https://llmstxt.org/
 */

import { docPages, siteMetadata } from "../data/docs.ts";
import { getPackageGroups, loadPackageDoc } from "../data/api-pages.ts";

/**
 * Extract the first line of documentation as a description
 */
function extractDescription(moduleDoc: string | undefined): string | null {
  if (!moduleDoc) return null;
  const firstLine = moduleDoc.split("\n")[0].trim();
  return firstLine ? firstLine : null;
}

/**
 * Get description for a package from its documentation
 */
async function getPackageDescription(packageName: string): Promise<string> {
  try {
    const doc = await loadPackageDoc(packageName);
    if (doc?.moduleDoc) {
      const desc = extractDescription(doc.moduleDoc);
      if (desc) return desc;
    }
  } catch {
    // Fallback to default description
  }
  return `${packageName} package`;
}

/**
 * Generate /llms.txt content - an index of documentation pages
 * This serves as a "sitemap for AI" with brief descriptions
 */
export async function generateLlmsTxt(): Promise<string> {
  const groups = await getPackageGroups();

  const lines: string[] = [
    `# ${siteMetadata.name}`,
    "",
    `> ${siteMetadata.description}`,
    "",
    "## Documentation",
    "",
    ...docPages.map((doc) =>
      `- [${doc.title}](${doc.path}.md): ${doc.description}`
    ),
    "",
    "## API Reference",
    "",
  ];

  // Add package groups
  for (const group of groups) {
    lines.push(`### ${group.name}`, "");
    for (const pkg of group.packages) {
      const desc = await getPackageDescription(pkg.name);
      lines.push(`- [\`${pkg.specifier}\`](/api/${pkg.name}.md): ${desc}`);
    }
    lines.push("");
  }

  lines.push(
    "## Links",
    "",
    `- [GitHub](${siteMetadata.github})`,
    `- [JSR Package](${siteMetadata.jsr})`,
    "",
  );

  return lines.join("\n");
}
