# Probitas Documentation

[![GitHub Pages](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://jsr-probitas.github.io/documents)
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
git clone https://github.com/jsr-probitas/documents.git
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
│   └── api/             # Generated API JSON (deno doc --json)
├── templates/           # JSX page templates
├── lib/                 # Utility modules
├── static/              # Static assets
└── scripts/             # Build scripts
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

This fetches the latest API information from all `@probitas/*` packages and
saves them to `data/api/`.

## Deployment

This site is deployed to **GitHub Pages** via GitHub Actions.

1. Push to `main` branch
2. GitHub Actions runs `deno task build`
3. Static files in `dist/` are deployed to GitHub Pages

Live site: https://jsr-probitas.github.io/documents

## License

[MIT](./LICENSE) © 2025 Alisue
