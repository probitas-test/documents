# Probitas Documentation

[![GitHub Pages](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://probitas-test.github.io/documents)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Documentation site for [Probitas](https://jsr.io/@probitas/probitas) - a
scenario-based testing framework for Deno.

## Features

- 📖 Comprehensive documentation with markdown source
- 🔗 Auto-generated API reference from TypeScript source
- 🤖 LLM-friendly endpoints (`/llms.txt`, `*.md`)
- ⚡ Static site generation with Hono SSG

## Quick Start

```bash
# Clone the repository
git clone https://github.com/probitas-test/documents.git
cd documents

# Start development server
deno task dev

# Open http://localhost:8000
```

## Commands

| Command                  | Description                       |
| ------------------------ | --------------------------------- |
| `deno task dev`          | Start dev server with watch mode  |
| `deno task start`        | Start production server           |
| `deno task build`        | Build static site to `dist/`      |
| `deno task preview`      | Preview built site                |
| `deno task check`        | Type check all files              |
| `deno task test`         | Run tests                         |
| `deno task verify`       | Run fmt, lint, check, and test    |
| `deno task generate-api` | Regenerate API documentation JSON |

## Project Structure

```
documents/
├── main.ts              # Entry point & Hono routes
├── deno.json            # Project configuration
├── docs/                # Markdown documentation source
├── data/
│   ├── api/             # Generated API JSON (deno doc --json)
│   ├── index/           # Example scenario index files
│   └── docs.ts          # Documentation pages configuration
├── templates/           # JSX page templates
│   ├── api/             # API reference templates
│   ├── docs/            # Documentation page templates
│   ├── Layout.tsx       # Main layout component
│   ├── HomeLayout.tsx   # Home page layout
│   ├── components.tsx   # Shared UI components
│   ├── home.tsx         # Home page template
│   └── scripts.ts       # Client-side JavaScript
├── lib/                 # Utility modules
│   ├── api-docs.ts      # API documentation types & utilities
│   ├── api-markdown.ts  # API markdown generation
│   ├── markdown.ts      # Markdown processing
│   ├── llms.ts          # LLM-friendly endpoints
│   ├── signature-formatters.ts  # Type signature formatting
│   └── type-references.ts       # Type reference resolution
├── static/              # Static assets (CSS, images, favicon)
├── scripts/             # Build & generation scripts
│   ├── build.ts         # Static site generation & Pagefind indexing
│   └── generate-api-docs.ts  # API documentation fetching
├── tests/               # Integration tests
└── probitas/            # Example Probitas scenarios
```

## Routes

| Path                        | Format   | Description           |
| --------------------------- | -------- | --------------------- |
| `/`                         | HTML     | Landing page          |
| `/index.md`                 | Markdown | Overview for LLMs     |
| `/llms.txt`                 | Text     | LLM site map          |
| `/docs/*`                   | HTML     | Documentation pages   |
| `/docs/*.md`                | Markdown | Raw markdown for LLMs |
| `/api/`                     | HTML     | API reference index   |
| `/api/{package}/`           | HTML     | Package API reference |
| `/api/{package}/index.json` | JSON     | API data              |
| `/api/{package}/index.md`   | Markdown | API docs for LLMs     |

## Development

### Prerequisites

- [Deno](https://deno.land/) 2.x or later

### Regenerating API Documentation

API documentation is generated from JSR packages using `deno doc`:

```bash
deno task generate-api
```

This script:

1. Fetches all `@probitas/*` packages from JSR API
2. Runs `deno doc --json` for each package
3. Processes and saves the output to `data/api/`
4. Formats the generated JSON files

The generated files are then used by the build process to create API reference
pages.

### Build Process

The `deno task build` command performs the following steps:

1. **Static Site Generation**: Uses Hono's SSG to generate HTML, JSON, and
   Markdown files
2. **Asset Copying**: Copies static assets (CSS, images, favicon) to `dist/`
3. **Search Indexing**: Runs [Pagefind](https://pagefind.app/) to generate a
   search index

The build requires Pagefind to be installed. On macOS:

```bash
brew install pagefind
```

For other platforms, see
[Pagefind installation guide](https://pagefind.app/docs/installation/).

## Deployment

This site is deployed to **GitHub Pages** via GitHub Actions.

1. Push to `main` branch
2. GitHub Actions runs `deno task build`
3. Static files in `dist/` are deployed to GitHub Pages

Live site: https://probitas-test.github.io/documents

## License

[MIT](./LICENSE) © 2025 Alisue
