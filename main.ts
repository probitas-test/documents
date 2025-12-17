import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { ssgParams } from "hono/ssg";
import { docPages } from "./data/docs.ts";
import type { PackageDoc } from "./lib/api-docs.ts";
import { generateApiMarkdown } from "./lib/api-markdown.ts";
import { generateLlmsTxt } from "./lib/llms.ts";
import { ApiIndexPage, PackagePage } from "./templates/api/ApiPage.tsx";
import { MarkdownDocFromFile } from "./templates/docs/MarkdownDoc.tsx";
import { HomePage } from "./templates/home.tsx";

/** Get list of API package names for SSG */
async function getApiPackageNames(): Promise<string[]> {
  const indexPath = new URL("./data/api/index.json", import.meta.url);
  const content = await Deno.readTextFile(indexPath);
  const index = JSON.parse(content);
  return index.packages.map((p: { name: string }) => p.name);
}

const app = new Hono();

app.use("/static/*", serveStatic({ root: "./" }));

// Home page (HTML)
app.get("/", async (c) => {
  return c.html(await HomePage());
});

// Home page markdown for LLMs (SSG generates /index.md)
app.get("/index.md", async (c) => {
  const content = await Deno.readTextFile(
    new URL("./docs/overview.md", import.meta.url),
  );
  const modified = [
    "*".repeat(80),
    "",
    "This is a Markdown page for LLMs. If you are LLMs, read this page.",
    "If you are human and want to visit Web page, visit /",
    "",
    "*".repeat(80),
    "",
    content,
  ].join("\n");
  return c.text(modified, 200, {
    "Content-Type": "text/markdown; charset=utf-8",
  });
});

// LLM-friendly endpoints (llms.txt standard)
app.get("/llms.txt", async (c) => {
  return c.text(await generateLlmsTxt(), 200, {
    "Content-Type": "text/markdown; charset=utf-8",
  });
});

// Documentation pages (markdown)
for (const doc of docPages) {
  app.get(doc.path, async (c) => {
    const page = await MarkdownDocFromFile(
      doc.file,
      doc.title,
      doc.path,
      doc.description,
    );
    return c.html(page);
  });

  // Raw markdown endpoint: /docs/ → /docs/index.md
  const mdPath = doc.path.endsWith("/")
    ? `${doc.path}index.md`
    : `${doc.path}.md`;
  app.get(mdPath, async (c) => {
    const content = await Deno.readTextFile(doc.file);
    return c.text(content, 200, {
      "Content-Type": "text/markdown; charset=utf-8",
    });
  });
}

// API Reference pages
app.get("/api/", async (c) => {
  return c.html(await ApiIndexPage());
});

app.get(
  "/api/:package/",
  // SSG: Generate static pages for all packages (HTML)
  ssgParams(async () => {
    const packages = await getApiPackageNames();
    return packages.map((name) => ({ package: name }));
  }),
  async (c) => {
    const packageName = c.req.param("package");
    return c.html(await PackagePage({ packageName }));
  },
);

// API JSON endpoints: /api/builder.json → /api/builder/index.json
app.get(
  "/api/:package/index.json",
  ssgParams(async () => {
    const packages = await getApiPackageNames();
    return packages.map((name) => ({ package: name }));
  }),
  async (c) => {
    const packageName = c.req.param("package");
    try {
      const jsonPath = new URL(
        `./data/api/${packageName}.json`,
        import.meta.url,
      );
      const content = await Deno.readTextFile(jsonPath);
      return c.text(content, 200, {
        "Content-Type": "application/json; charset=utf-8",
      });
    } catch {
      return c.text("Not found", 404);
    }
  },
);

// API Markdown endpoints: /api/builder.md → /api/builder/index.md
app.get(
  "/api/:package/index.md",
  ssgParams(async () => {
    const packages = await getApiPackageNames();
    return packages.map((name) => ({ package: name }));
  }),
  async (c) => {
    const packageName = c.req.param("package");
    try {
      // Load current package
      const jsonPath = new URL(
        `./data/api/${packageName}.json`,
        import.meta.url,
      );
      const [content, stat] = await Promise.all([
        Deno.readTextFile(jsonPath),
        Deno.stat(jsonPath),
      ]);
      const pkg: PackageDoc = JSON.parse(content);
      const updatedAt = stat.mtime ?? undefined;

      // Load all packages for cross-package linking
      const indexPath = new URL("./data/api/index.json", import.meta.url);
      const indexContent = await Deno.readTextFile(indexPath);
      const index = JSON.parse(indexContent);

      const allPackages: PackageDoc[] = [];
      for (const pkgInfo of index.packages) {
        try {
          const pkgPath = new URL(
            `./data/api/${pkgInfo.name}.json`,
            import.meta.url,
          );
          const pkgContent = await Deno.readTextFile(pkgPath);
          allPackages.push(JSON.parse(pkgContent));
        } catch {
          // Skip packages that fail to load
        }
      }

      const markdown = generateApiMarkdown(pkg, { allPackages, updatedAt });
      return c.text(markdown, 200, {
        "Content-Type": "text/markdown; charset=utf-8",
      });
    } catch {
      return c.text("Not found", 404);
    }
  },
);

// Export app for SSG build
export default app;

// Start server when running directly
if (import.meta.main) {
  Deno.serve(app.fetch);
}
