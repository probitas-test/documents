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
  `expect(result).toBeOk().toHaveJsonMatching({...})`

## Installation

### Install CLI

Requires [Deno](https://deno.land/) v2.x or later.

Install the CLI to run scenarios using the shell installer:

```bash
curl -fsSL https://raw.githubusercontent.com/jsr-probitas/cli/main/install.sh | bash
```

**Options via environment variables:**

```bash
# Install specific version
curl -fsSL https://raw.githubusercontent.com/jsr-probitas/cli/main/install.sh | PROBITAS_VERSION=0.7.3 bash

# Install to custom directory
curl -fsSL https://raw.githubusercontent.com/jsr-probitas/cli/main/install.sh | PROBITAS_INSTALL_DIR=/usr/local/bin bash
```

### Using Homebrew (macOS/Linux)

Install via the official Homebrew tap:

```bash
# Add the tap and install
brew tap jsr-probitas/tap
brew install probitas

# Or install directly
brew install jsr-probitas/tap/probitas
```

Deno is installed automatically as a dependency.

### Using Nix

Use the flake to run or install the CLI:

```bash
# Run without installing
nix run github:jsr-probitas/cli

# Install into your profile
nix profile install github:jsr-probitas/cli
```

## Quick Start

### Initialize a Project

Create a new Probitas project with example files:

```bash
# Create probitas/ directory with example files
probitas init

# Create custom directory
probitas init -d scenarios

# Overwrite existing files
probitas init --force
```

This creates:

- `example.probitas.ts` - Example scenario file
- `probitas.jsonc` - Configuration file with defaults

### Your First Scenario

```typescript
import { client, expect, scenario } from "jsr:@probitas/probitas";

export default scenario("User API Test")
  .resource("http", () =>
    client.http.createHttpClient({
      url: "http://localhost:8080",
    }))
  .step("GET /users/1", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/users/1");

    expect(res)
      .toBeOk()
      .toHaveStatus(200)
      .toHaveJsonMatching({ id: 1 });
  })
  .build();
```

## File Naming Convention

Scenario files should use the `.probitas.ts` extension and be placed in the
`probitas/` directory:

```
probitas/
  auth.probitas.ts
  user-crud.probitas.ts
  payment-flow.probitas.ts
```

## Running Scenarios

```bash
# Run all scenarios
probitas run

# Run scenarios with specific tag
probitas run -s tag:example

# Run with different reporter
probitas run --reporter json
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
- `json` - Machine-readable JSON

## Available Clients

All clients are accessed via the [`client`](/api/client/) namespace:

| Client     | Factory Function                                                                               | Protocol              |
| ---------- | ---------------------------------------------------------------------------------------------- | --------------------- |
| HTTP       | [`client.http.createHttpClient()`](/api/client-http/#createHttpClient)                         | HTTP/HTTPS            |
| PostgreSQL | [`client.sql.postgres.createPostgresClient()`](/api/client-sql-postgres/#createPostgresClient) | PostgreSQL            |
| MySQL      | [`client.sql.mysql.createMySqlClient()`](/api/client-sql-mysql/#createMySqlClient)             | MySQL                 |
| SQLite     | [`client.sql.sqlite.createSqliteClient()`](/api/client-sql-sqlite/#createSqliteClient)         | SQLite                |
| DuckDB     | [`client.sql.duckdb.createDuckDbClient()`](/api/client-sql-duckdb/#createDuckDbClient)         | DuckDB                |
| gRPC       | [`client.grpc.createGrpcClient()`](/api/client-grpc/#createGrpcClient)                         | gRPC                  |
| ConnectRPC | [`client.connectrpc.createConnectRpcClient()`](/api/client-connectrpc/#createConnectRpcClient) | Connect/gRPC/gRPC-Web |
| GraphQL    | [`client.graphql.createGraphqlClient()`](/api/client-graphql/#createGraphqlClient)             | GraphQL               |
| Redis      | [`client.redis.createRedisClient()`](/api/client-redis/#createRedisClient)                     | Redis                 |
| MongoDB    | [`client.mongodb.createMongoClient()`](/api/client-mongodb/#createMongoClient)                 | MongoDB               |
| Deno KV    | [`client.deno_kv.createDenoKvClient()`](/api/client-deno-kv/#createDenoKvClient)               | Deno KV               |
| RabbitMQ   | [`client.rabbitmq.createRabbitMqClient()`](/api/client-rabbitmq/#createRabbitMqClient)         | AMQP                  |
| SQS        | [`client.sqs.createSqsClient()`](/api/client-sqs/#createSqsClient)                             | AWS SQS               |

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
  .resource(name, factoryFn, options?)    // Register resources (factory function)
  .setup(name?, fn, options?)             // Add setup/cleanup hooks (name optional)
  .step(name?, fn, options?)              // Define test steps (name optional)
  .build()                                // Create immutable definition
```

### Expect API

The [`expect()`](/api/expect/#expect) function auto-dispatches based on result
type:

```typescript
import { client, expect } from "jsr:@probitas/probitas";

await using http = client.http.createHttpClient({
  url: "http://localhost:8080",
});
const httpResponse = await http.get("/users/1");

// HTTP response
expect(httpResponse)
  .toBeOk()
  .toHaveStatus(200)
  .toHaveJsonMatching({ id: 1 });

await using pg = await client.sql.postgres.createPostgresClient({
  url: "postgres://user:pass@localhost/db",
});
const sqlResult = await pg.query("SELECT * FROM users WHERE id = $1", [1]);

// SQL result
expect(sqlResult)
  .toHaveRowCount(1)
  .toHaveRowsMatching({ name: "Alice" });

await using grpc = client.grpc.createGrpcClient({ url: "localhost:50051" });
const grpcResponse = await grpc.call("users.UserService", "GetUser", {
  id: "123",
});

// gRPC response
expect(grpcResponse)
  .toBeOk()
  .toHaveDataMatching({ id: "123" });
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
} from "jsr:@probitas/probitas";
```

## Next Steps

- [Scenario Guide](/docs/scenario/) - Learn how to write scenarios in detail
- [Client Guide](/docs/client/) - Detailed reference for each client
- [Expect Guide](/docs/expect/) - Type-safe assertions for response validation
- [Configuration](/docs/configuration/) - Timeout, retry, and other options
