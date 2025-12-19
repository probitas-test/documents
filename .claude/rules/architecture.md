---
paths: "main.ts, lib/**/*.ts, templates/**/*.tsx, scripts/**/*.ts"
---

# Site Architecture

## Directory Structure

```
documents/
├── main.ts           # Entry point (Deno.serve)
├── docs/             # Markdown documentation
├── data/api/         # Generated from `deno doc --json`
├── lib/              # Core modules (markdown, api-docs)
├── templates/        # Hono JSX components
└── scripts/          # Build and generation scripts
```

## Routes

| Path                  | Description              |
| --------------------- | ------------------------ |
| `/`                   | Landing page             |
| `/docs/{page}`        | Documentation pages      |
| `/api/{package}`      | API reference            |

## API Generation

```bash
# Generate API docs (run from scripts/generate-api-docs.ts)
deno task generate-api
```
