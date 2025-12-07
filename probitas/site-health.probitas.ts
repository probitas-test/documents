import { client, expect, scenario } from "probitas";
import { getPackageList } from "../data/api-pages.ts";
import { docPages } from "../data/docs.ts";

const BASE_URL = Deno.env.get("DOCS_BASE_URL") ?? "http://localhost:8000";

async function loadDocHeadings(): Promise<Record<string, string>> {
  const headings: Record<string, string> = {};
  for (const doc of docPages) {
    try {
      const content = await Deno.readTextFile(
        new URL(doc.file, import.meta.url),
      );
      const match = content.match(/^# .+/m);
      if (match) {
        headings[doc.path] = match[0];
      }
    } catch {
      // Ignore missing local files; remote check will still validate status/ctype
    }
  }
  return headings;
}

const docHeadings = await loadDocHeadings();

export default scenario("Probitas docs site health", {
  tags: ["smoke", "docs"],
})
  .resource("http", () =>
    client.http.createHttpClient({
      url: BASE_URL,
    }))
  .step("serves LLM-friendly markdown at /", async ({ resources }) => {
    const res = await resources.http.get("/", {
      headers: { accept: "text/markdown" },
    });

    expect(res)
      .ok()
      .status(200)
      .contentType(/text\/markdown/)
      .textContains("This is a Markdown page for LLMs.")
      .textContains("# Probitas");
  })
  .step("serves human homepage HTML", async ({ resources }) => {
    const res = await resources.http.get("/", {
      query: { human: "1" },
      headers: { accept: "text/html" },
    });

    expect(res)
      .ok()
      .status(200)
      .contentType(/text\/html/)
      .textContains("Probitas - Scenario-based Testing Framework")
      .textContains(
        "Scenario-based testing framework designed for API, database, and message queue testing",
      )
      .textContains("AI-Friendly Documentation");
  })
  .step("exposes raw markdown for docs pages", async ({ resources }) => {
    for (const doc of docPages) {
      const res = await resources.http.get(`${doc.path}.md`);
      const heading = docHeadings[doc.path] ?? "# ";
      expect(res)
        .ok()
        .status(200)
        .contentType(/text\/markdown/)
        .textContains(heading);
    }
  })
  .step("renders docs HTML pages", async ({ resources }) => {
    for (const doc of docPages) {
      const res = await resources.http.get(doc.path, {
        headers: { accept: "text/html" },
      });
      expect(res)
        .ok()
        .status(200)
        .contentType(/text\/html/)
        .textContains(doc.label);
    }
  })
  .step("provides LLM endpoints", async ({ resources }) => {
    const indexRes = await resources.http.get("/llms.txt");
    expect(indexRes)
      .ok()
      .status(200)
      .contentType(/text\/markdown/)
      .textContains("## Documentation")
      .textContains("## API Reference");
  })
  .step("renders API index and package JSON", async ({ resources }) => {
    const indexRes = await resources.http.get("/api", {
      headers: { accept: "text/html" },
    });
    expect(indexRes).ok().status(200).textContains("API Reference");

    const packages = await getPackageList();
    for (const pkg of packages) {
      const res = await resources.http.get(`/api/${pkg.name}.json`);
      expect(res)
        .ok()
        .status(200)
        .contentType(/application\/json/)
        .dataContains({ name: pkg.name, specifier: pkg.specifier });
    }
  })
  .step("renders API markdown endpoints", async ({ resources }) => {
    const packages = await getPackageList();
    for (const pkg of packages) {
      const res = await resources.http.get(`/api/${pkg.name}.md`);
      expect(res)
        .ok()
        .status(200)
        .contentType(/text\/markdown/)
        .textContains(pkg.specifier);
    }
  })
  .step("serves static assets", async ({ resources }) => {
    const res = await resources.http.get("/static/style.css");
    expect(res).ok().status(200).contentType(/text\/css/);
  })
  .build();
