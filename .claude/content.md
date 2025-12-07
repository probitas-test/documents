# Content Guidelines

Guidelines for writing and maintaining documentation content.

## Documentation Structure

### Overview (`/docs`)

- Introduction to Probitas
- Quick start example
- Feature highlights
- Available clients table
- Links to detailed guides

### Scenario Guide (`/docs/scenario`)

- Complete scenario structure explanation
- Builder pattern usage
- Resource management
- Setup and cleanup hooks
- Step definitions and chaining
- Error handling

### Client API (`/docs/client`)

- Client-specific usage patterns
- Connection configuration
- Common operations
- Protocol-specific features

### Configuration (`/docs/config`)

- Timeout settings
- Retry configuration
- Runner options
- Reporter customization

### API Reference (`/docs/api`)

- Index page listing all packages
- Per-package API documentation
- Cross-package type linking

#### Core Packages (from `probitas/`)

| Package              | Description                   |
| -------------------- | ----------------------------- |
| `@probitas/probitas` | Primary user-facing API       |
| `@probitas/builder`  | Type-safe scenario definition |
| `@probitas/runner`   | Scenario execution engine     |
| `@probitas/reporter` | Output formatters             |
| `@probitas/scenario` | Scenario loading/filtering    |
| `@probitas/discover` | File discovery                |
| `@probitas/cli`      | Command-line interface        |

#### Client Packages (from `probitas-client/`)

| Package                         | Description                  |
| ------------------------------- | ---------------------------- |
| `@probitas/client`              | Client base and factory      |
| `@probitas/client-http`         | HTTP/HTTPS client            |
| `@probitas/client-grpc`         | gRPC client                  |
| `@probitas/client-graphql`      | GraphQL client               |
| `@probitas/client-connectrpc`   | Connect/gRPC/gRPC-Web client |
| `@probitas/client-redis`        | Redis client                 |
| `@probitas/client-mongodb`      | MongoDB client               |
| `@probitas/client-deno-kv`      | Deno KV client               |
| `@probitas/client-rabbitmq`     | RabbitMQ (AMQP) client       |
| `@probitas/client-sqs`          | AWS SQS client               |
| `@probitas/client-sql`          | SQL client base              |
| `@probitas/client-sql-postgres` | PostgreSQL client            |
| `@probitas/client-sql-mysql`    | MySQL client                 |
| `@probitas/client-sql-sqlite`   | SQLite client                |
| `@probitas/client-sql-duckdb`   | DuckDB client                |

## Writing Style

### Code Examples

Every concept should have a runnable code example:

```typescript
import { client, expect, scenario } from "probitas";

export default scenario("Example")
  .resource("http", client.http.createHttpClient())
  .step("make request", async ({ http }) => {
    const res = await http.get("/api/users");
    expect(res).ok().status(200);
  })
  .build();
```

### Tone

- **Concise** - Get to the point quickly
- **Practical** - Focus on real-world usage
- **Progressive** - Simple concepts before complex ones

### Formatting

- Use fenced code blocks with language hints
- Use tables for structured data (client list, options)
- Use headings to create scannable structure
- Link to related sections

## API Documentation

### Generated from Source

API reference is auto-generated from all `@probitas/*` packages across two
repositories:

- `probitas/` - Core framework packages
- `probitas-client/` - Protocol client packages

```bash
# Generate API JSON for each package
deno doc --json jsr:@probitas/probitas > data/api/probitas.json
deno doc --json jsr:@probitas/client-http > data/api/client-http.json
# ... and so on for each package
```

Update these files when the API changes.

### Type Linking

The renderer automatically links types:

- **Internal types** - Link to `#SymbolName` anchor within same package
- **Cross-package types** - Link to `/docs/api/{package}#SymbolName`
- **External types** - Link to MDN or TypeScript docs

Supported external types:

- JavaScript: `Promise`, `Error`, `Uint8Array`, `ReadableStream`
- Web APIs: `Response`, `Request`, `Headers`, `URL`
- TypeScript: `Record`, `Partial`, `Required`, `Omit`, `Pick`, `ReturnType`
