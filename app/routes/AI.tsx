/**
 * AI documentation route
 *
 * Renders the AI scenario testing documentation page.
 * Route: /AI
 */
import { createRoute } from "honox/factory";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MarkdownDocFromFile } from "../templates/docs/MarkdownDoc.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default createRoute(async (c) => {
  const filePath = path.resolve(__dirname, "../../AI.md");
  const content = await MarkdownDocFromFile(
    filePath,
    "AI Scenario Testing",
    "/AI",
    "How to have AI write and run Probitas scenario tests with Claude plugins",
  );
  return c.html(content);
});
