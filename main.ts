import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { docPages } from "./data/docs.ts";
import { MarkdownDocFromFile } from "./templates/docs/MarkdownDoc.tsx";
import { HomePage } from "./templates/home.tsx";

const app = new Hono();

app.use("/static/*", serveStatic({ root: "./" }));

// Home page
app.get("/", async (c) => c.html(await HomePage()));

// Documentation pages (markdown)
for (const doc of docPages) {
  app.get(doc.path, async (c) => {
    const page = await MarkdownDocFromFile(doc.file, doc.title);
    return c.html(page);
  });
}

Deno.serve(app.fetch);
