# Probitas

Probitas is a scenario-based testing framework for Deno. It provides intuitive
APIs for writing integration tests for APIs, databases, message queues, and
other backend services.

## Features

- **Scenario-based testing**: Define tests as readable scenarios with setup,
  steps, and cleanup
- **Multi-protocol support**: HTTP, gRPC, GraphQL, SQL, Redis, MongoDB, and
  message queues with unified APIs
- **Type-safe**: Full type inference through the builder chain
- **Fluent assertions**: Natural syntax like
  `expect(result).ok().dataContains({...})`

## Installation

### Add to deno.json

Add Probitas to your project's `deno.json`:

```json
{
  "imports": {
    "probitas": "jsr:@probitas/probitas"
  }
}
```

### Install CLI

Install the CLI to run scenarios:

```bash
deno install -grAf -n probitas jsr:@probitas/cli
```

- `-g` Global install
- `-r` Reload cache (fetch latest version)
- `-A` All permissions
- `-f` Force overwrite existing
- `-n probitas` Command name

### Using Nix

Use the flake to run or install the CLI without Deno-level globals:

```bash
# Run without installing
nix run github:jsr-probitas/probitas

# Install into your profile
nix profile install github:jsr-probitas/probitas#probitas
```

The flake packages a wrapper that runs the bundled CLI with the repository
import map and lockfile.

## Quick Start

```typescript
import { client, expect, scenario } from "probitas";

export default scenario("User API Test")
  .resource("http", () =>
    client.http.createHttpClient({
      url: "http://localhost:8080",
    }))
  .step("GET /users/1", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/users/1");

    expect(res)
      .ok()
      .status(200)
      .dataContains({ id: 1 });
  })
  .build();
```

## File Naming Convention

Scenario files should use the `.probitas.ts` extension:

```
src/
  probitas/
    auth.probitas.ts
    user-crud.probitas.ts
    payment-flow.probitas.ts
```

## Running Scenarios

### Initialize a Project

```bash
probitas init
```

This creates:

- deno.json - Configuration with probitas import and settings
- probitas/example.probitas.ts - Example scenario

### Run Scenarios

```bash
# Run all scenarios
probitas run

# Run scenarios with specific tag
probitas run -s tag:example

# Run with different reporter
probitas run --reporter dot
```

### Tag-Based Filtering

Organize scenarios with tags for easy filtering:

```bash
probitas run -s tag:auth              # Match tag
probitas run -s "tag:critical,tag:auth"  # AND logic
probitas run -s "!tag:slow"              # NOT logic
```

### Reporters

Choose output format based on your needs:

- `list` - Detailed human-readable output (default)
- `dot` - Compact progress dots
- `json` - Machine-readable JSON
- `tap` - TAP format for CI integration

## Available Clients

All clients are accessed via the `client` namespace:

| Client     | Factory Function                             | Protocol              |
| ---------- | -------------------------------------------- | --------------------- |
| HTTP       | `client.http.createHttpClient()`             | HTTP/HTTPS            |
| PostgreSQL | `client.sql.postgres.createPostgresClient()` | PostgreSQL            |
| MySQL      | `client.sql.mysql.createMySqlClient()`       | MySQL                 |
| SQLite     | `client.sql.sqlite.createSqliteClient()`     | SQLite                |
| DuckDB     | `client.sql.duckdb.createDuckDbClient()`     | DuckDB                |
| gRPC       | `client.grpc.createGrpcClient()`             | gRPC                  |
| ConnectRPC | `client.connectrpc.createConnectRpcClient()` | Connect/gRPC/gRPC-Web |
| GraphQL    | `client.graphql.createGraphqlClient()`       | GraphQL               |
| Redis      | `client.redis.createRedisClient()`           | Redis                 |
| MongoDB    | `client.mongodb.createMongoClient()`         | MongoDB               |
| Deno KV    | `client.deno_kv.createDenoKvClient()`        | Deno KV               |
| RabbitMQ   | `client.rabbitmq.createRabbitMqClient()`     | AMQP                  |
| SQS        | `client.sqs.createSqsClient()`               | AWS SQS               |

## Core Concepts

### Scenario

A scenario is a complete test case composed of:

- **Name**: Descriptive identifier for the test
- **Resources**: Managed dependencies (clients, connections)
- **Setup hooks**: Initialization code with cleanup callbacks
- **Steps**: Sequential test operations with assertions

### Builder Pattern

```
scenario(name, options?)
  .resource(name, factoryFn)  // Register resources (factory function)
  .setup(fn)                  // Add setup/cleanup hooks
  .step(name, fn, options?)   // Define test steps
  .build()                    // Create immutable definition
```

### Expect API

The `expect()` function auto-dispatches based on result type:

```typescript
// HTTP response
expect(httpResponse).ok().status(200).dataContains({ id: 1 });

// SQL result
expect(sqlResult).count(1).dataContains({ name: "Alice" });

// gRPC response
expect(grpcResponse).ok().dataContains({ id: "123" });
```

## Included Utilities

Probitas re-exports useful libraries for convenience:

```typescript
import {
  assertSpyCalls,
  // Test data generation
  faker,
  // Time control
  FakeTime,
  // Template literal dedent
  outdent,
  // Error handling
  raise,
  // Mocking
  spy,
  stub,
  tryOr,
} from "probitas";
```

## Next Steps

- [Scenario Guide](/docs/scenario) - Learn how to write scenarios in detail
- [Client API](/docs/client) - Detailed reference for each client
- [Configuration](/docs/configuration) - Timeout, retry, and other options
