import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { docPages } from "./data/docs.ts";
import type { PackageDoc } from "./lib/api-docs.ts";
import { generateApiMarkdown } from "./lib/api-markdown.ts";
import { generateLlmsTxt } from "./lib/llms.ts";
import { ApiIndexPage, PackagePage } from "./templates/api/ApiPage.tsx";
import { MarkdownDocFromFile } from "./templates/docs/MarkdownDoc.tsx";
import { HomePage } from "./templates/home.tsx";

const app = new Hono();

app.use("/static/*", serveStatic({ root: "./" }));

// Home page
app.get("/", async (c) => {
  const accept = (c.req.header("accept") ?? "").toLowerCase();
  const human = c.req.query("human");

  if (human !== "1" && !accept.includes("text/html")) {
    const content = await Deno.readTextFile(
      new URL("./docs/overview.md", import.meta.url),
    );
    const modified = [
      "*".repeat(80),
      "",
      "This is a Markdown page for LLMs. If you are LLMs, read this page.",
      "If you are human and want to visit Web page, add ?human=1 to the URL.",
      "",
      "*".repeat(80),
      "",
      content,
    ].join("\n");
    return c.text(modified, 200, {
      "Content-Type": "text/markdown; charset=utf-8",
    });
  }

  return c.html(await HomePage());
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

  // Raw markdown endpoint (append .md to get source)
  app.get(`${doc.path}.md`, async (c) => {
    const content = await Deno.readTextFile(doc.file);
    return c.text(content, 200, {
      "Content-Type": "text/markdown; charset=utf-8",
    });
  });
}

// API Reference pages
app.get("/api", async (c) => {
  return c.html(await ApiIndexPage());
});

app.get("/api/:package", async (c) => {
  const param = c.req.param("package");

  // Check if requesting JSON
  if (param.endsWith(".json")) {
    const packageName = param.slice(0, -5); // Remove .json suffix
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
  }

  // Check if requesting Markdown
  if (param.endsWith(".md")) {
    const packageName = param.slice(0, -3); // Remove .md suffix
    try {
      // Load current package
      const jsonPath = new URL(
        `./data/api/${packageName}.json`,
        import.meta.url,
      );
      const content = await Deno.readTextFile(jsonPath);
      const pkg: PackageDoc = JSON.parse(content);

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

      const markdown = generateApiMarkdown(pkg, { allPackages });
      return c.text(markdown, 200, {
        "Content-Type": "text/markdown; charset=utf-8",
      });
    } catch {
      return c.text("Not found", 404);
    }
  }

  // Otherwise render HTML page
  return c.html(await PackagePage({ packageName: param }));
});

Deno.serve(app.fetch);
