# Architecture

This document describes the architecture and design decisions for the Probitas
documentation site.

## Overview

A documentation website for Probitas, deployed to Deno Deploy.

## Directory Structure

```
documents/
├── main.ts                 # Entry point (Deno.serve)
├── deno.json               # Project config
├── docs/                   # Markdown documentation
│   ├── index.md            # Overview
│   ├── scenario.md         # Scenario guide
│   ├── config.md           # Configuration reference
│   └── client/
│       └── index.md        # Client API guide
├── data/
│   └── api/                # Generated from `deno doc --json`
│       ├── probitas.json
│       ├── builder.json
│       ├── runner.json
│       ├── reporter.json
│       ├── scenario.json
│       ├── discover.json
│       ├── cli.json
│       ├── client.json
│       ├── client-http.json
│       ├── client-grpc.json
│       └── ... (other clients)
├── src/
│   └── web/
│       ├── routes.ts       # Hono route definitions
│       ├── api-renderer.ts # API doc HTML renderer
│       └── templates/
│           └── layout.ts   # HTML template with CSS
└── .github/
    └── workflows/
        └── deploy.yml      # Deno Deploy automation
```

## Technology Stack

- **Hono** - Lightweight web framework for edge

## Routes

| Path                  | Description                        |
| --------------------- | ---------------------------------- |
| `/`                   | Landing page                       |
| `/docs`               | Documentation overview             |
| `/docs/scenario`      | Scenario writing guide             |
| `/docs/client`        | Client API reference               |
| `/docs/config`        | Configuration options              |
| `/docs/api`           | API reference index                |
| `/docs/api/{package}` | API reference for specific package |

## API Reference Generation

The API reference is generated from all `@probitas/*` packages:

```bash
# Core packages (from probitas/)
deno doc --json jsr:@probitas/probitas > data/api/probitas.json
deno doc --json jsr:@probitas/builder > data/api/builder.json
deno doc --json jsr:@probitas/runner > data/api/runner.json
deno doc --json jsr:@probitas/reporter > data/api/reporter.json
deno doc --json jsr:@probitas/scenario > data/api/scenario.json
deno doc --json jsr:@probitas/discover > data/api/discover.json
deno doc --json jsr:@probitas/cli > data/api/cli.json

# Client packages (from probitas-client/)
deno doc --json jsr:@probitas/client > data/api/client.json
deno doc --json jsr:@probitas/client-http > data/api/client-http.json
deno doc --json jsr:@probitas/client-grpc > data/api/client-grpc.json
deno doc --json jsr:@probitas/client-graphql > data/api/client-graphql.json
deno doc --json jsr:@probitas/client-connectrpc > data/api/client-connectrpc.json
deno doc --json jsr:@probitas/client-redis > data/api/client-redis.json
deno doc --json jsr:@probitas/client-mongodb > data/api/client-mongodb.json
deno doc --json jsr:@probitas/client-deno-kv > data/api/client-deno-kv.json
deno doc --json jsr:@probitas/client-rabbitmq > data/api/client-rabbitmq.json
deno doc --json jsr:@probitas/client-sqs > data/api/client-sqs.json
deno doc --json jsr:@probitas/client-sql > data/api/client-sql.json
deno doc --json jsr:@probitas/client-sql-postgres > data/api/client-sql-postgres.json
deno doc --json jsr:@probitas/client-sql-mysql > data/api/client-sql-mysql.json
deno doc --json jsr:@probitas/client-sql-sqlite > data/api/client-sql-sqlite.json
deno doc --json jsr:@probitas/client-sql-duckdb > data/api/client-sql-duckdb.json
```

The `api-renderer.ts` module:

1. Parses JSON for each package
2. Renders to HTML with syntax highlighting
3. Links type names to internal symbols or external docs (MDN, TypeScript)
4. Supports cross-package type linking

## Design Principles

### 1. Single Source of Truth

- API docs generated from actual TypeScript source
- Documentation in Markdown for easy editing

### 2. Edge-First

- No build step required
- All rendering happens at request time
- Fast cold starts for Deno Deploy

### 3. Developer-Friendly

- Type-linked API documentation
- Code examples in every section
- Syntax-highlighted code blocks
