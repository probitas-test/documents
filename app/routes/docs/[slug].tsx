/**
 * Dynamic documentation route
 *
 * Renders documentation pages based on slug.
 * Route: /docs/:slug (e.g., /docs/installation, /docs/scenario)
 */
import { createRoute } from "honox/factory";
import { ssgParams } from "hono/ssg";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MarkdownDocFromFile } from "../../templates/docs/MarkdownDoc.js";
import { docPages } from "../../../data/docs.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Filter doc pages that have a slug (not the root /docs)
const sluggedPages = docPages.filter((doc) => {
  const parts = doc.path.split("/").filter(Boolean);
  return parts.length > 1 && parts[0] === "docs";
});

export default createRoute(
  ssgParams(() => {
    return sluggedPages.map((doc) => {
      const parts = doc.path.split("/").filter(Boolean);
      return { slug: parts.slice(1).join("/") };
    });
  }),
  async (c) => {
    const slug = c.req.param("slug");
    const docPage = sluggedPages.find((doc) => {
      const parts = doc.path.split("/").filter(Boolean);
      return parts.slice(1).join("/") === slug;
    });

    if (!docPage) {
      return c.notFound();
    }

    const filePath = path.resolve(__dirname, "../../..", docPage.file);
    const content = await MarkdownDocFromFile(
      filePath,
      docPage.title,
      docPage.path,
      docPage.description,
    );
    return c.html(content);
  },
);
