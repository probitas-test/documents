---
paths: "app/**/*.{ts,tsx}, scripts/**/*.ts, vite.config.ts"
---

# Site Architecture

## Directory Structure

```
documents/
├── app/                         # Application source
│   ├── server.ts                # HonoX entry point
│   ├── client.ts                # Client-side JavaScript (bundled by Vite)
│   ├── routes/                  # HonoX file-based routes
│   │   ├── _renderer.tsx        # Global layout renderer (jsxRenderer)
│   │   ├── index.tsx            # Home page route
│   │   ├── AI.tsx               # AI documentation route
│   │   ├── api/
│   │   │   ├── index.tsx        # API index route
│   │   │   └── [package].tsx    # Dynamic API package route
│   │   └── docs/
│   │       ├── index.tsx        # Docs index route
│   │       └── [slug].tsx       # Dynamic docs route
│   ├── templates/               # Page-level JSX components
│   │   ├── Layout.tsx           # Main layout component
│   │   ├── HomeLayout.tsx       # Home page layout
│   │   ├── components.tsx       # Shared UI components
│   │   ├── home.tsx             # Home page template
│   │   ├── scripts.ts           # Inline scripts for SSG
│   │   ├── api/                 # API page templates
│   │   └── docs/                # Documentation page templates
│   ├── components/              # Reusable UI components
│   │   ├── Header.tsx           # Global header navigation
│   │   ├── SearchModal.tsx      # Search modal component
│   │   ├── ScrollToTop.tsx      # Scroll-to-top button
│   │   ├── TableOfContents.tsx  # Table of contents sidebar
│   │   └── DocLayout.tsx        # Documentation page layout
│   └── lib/                     # Core modules
│       ├── api-docs.ts          # API documentation types & utilities
│       ├── api-markdown.ts      # API markdown generation
│       ├── markdown.ts          # Markdown processing & link rewriting
│       ├── llms.ts              # LLM-friendly endpoints generation
│       ├── path.ts              # basePath() helper for GitHub Pages
│       ├── signature-formatters.ts  # Type signature formatting
│       └── type-references.ts   # Type reference resolution
├── data/                        # Data modules
│   ├── api/                     # Generated API JSON (deno doc --json)
│   ├── docs.ts                  # Documentation pages configuration
│   └── api-pages.ts             # API documentation loader
├── docs/                        # Markdown documentation source
├── public/                      # Static assets (CSS, images, favicon)
├── scripts/                     # Build and generation scripts
│   ├── post-build.js            # Pagefind indexing & llms.txt.html→llms.txt rename
│   └── generate-api-docs.ts     # Fetch & process API docs from JSR
├── package.json                 # npm dependencies
├── vite.config.ts               # Vite + HonoX SSG configuration
└── tsconfig.json                # TypeScript configuration
```

## Routes

| Path                        | Format   | Description                |
| --------------------------- | -------- | -------------------------- |
| `/`                         | HTML     | Landing page               |
| `/index.md`                 | Markdown | Overview for LLMs          |
| `/llms.txt`                 | Text     | LLM site map               |
| `/docs/*`                   | HTML     | Documentation pages        |
| `/docs/*.md`                | Markdown | Raw markdown for LLMs      |
| `/api/`                     | HTML     | API reference index        |
| `/api/{package}/`           | HTML     | Package API reference      |
| `/api/{package}/index.json` | JSON     | Raw API data               |
| `/api/{package}/index.md`   | Markdown | API documentation for LLMs |

## Build Workflow

### 1. API Documentation Generation

```bash
deno run -A scripts/generate-api-docs.ts
```

1. Fetches all `@probitas/*` packages from JSR API
2. Runs `deno doc --json` for each package
3. Processes and filters exports (removes private items, imports, etc.)
4. Saves to `data/api/{package}.json`
5. Generates `data/api/index.json` with package metadata

### 2. Static Site Generation

```bash
npm run build
```

1. **Client Build**: Builds client.ts → dist/static/client.js
2. **SSG Build**: HonoX + Vite SSG generates HTML/JSON/Markdown files (Vite
   automatically copies public/ to dist/)
3. **Post-Build**: Renames llms.txt.html → llms.txt, runs Pagefind

## Client-Side Features

The site includes JavaScript functionality (see `app/client.ts` and
`app/templates/scripts.ts`):

- **Theme switching**: Light/dark mode with localStorage persistence
- **Code highlighting**: Dynamic highlight.js loading with theme sync
- **Code copy buttons**: Copy-to-clipboard for code blocks
- **Carousel**: Interactive example carousel on home page
- **Search modal**: Pagefind-powered search (Cmd/Ctrl+K)
- **Scroll-to-top**: Floating button for long pages
