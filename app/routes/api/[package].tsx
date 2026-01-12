/**
 * Dynamic API package route
 *
 * Renders individual package documentation pages.
 * Route: /api/:package
 */
import { createRoute } from "honox/factory";
import { ssgParams } from "hono/ssg";
import { PackagePage } from "../../templates/api/ApiPage.js";

// Get package names for SSG
async function getPackageNames(): Promise<string[]> {
  const { readFile } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const path = await import("node:path");

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const indexPath = path.resolve(__dirname, "../../../data/api/index.json");
  const content = await readFile(indexPath, "utf-8");
  const index = JSON.parse(content);
  return index.packages.map((p: { name: string }) => p.name);
}

export default createRoute(
  ssgParams(async () => {
    const packages = await getPackageNames();
    return packages.map((name) => ({ package: name }));
  }),
  async (c) => {
    const packageName = c.req.param("package");
    const content = await PackagePage({ packageName });
    return c.html(content);
  },
);
