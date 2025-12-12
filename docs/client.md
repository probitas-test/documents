# Client

Learn how to use Probitas clients to interact with various services and
protocols. This guide covers available clients, common patterns, and best
practices for effective testing.

## Overview

Probitas provides unified client APIs for connecting to external services during
scenario testing. All clients share common patterns:

- **Unified namespace**: Access all clients via `client.*`
- **Automatic cleanup**: Clients implement `AsyncDisposable` for resource
  management
- **Consistent options**: Common settings like timeout, retry, and abort signal
- **Built-in assertions**: Use `expect()` for response validation

```typescript
import { client, expect, scenario } from "probitas";

export default scenario("API Test")
  .resource("http", () =>
    client.http.createHttpClient({
      url: "http://localhost:8080",
    }))
  .step("Make request", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/health");
    expect(res).toBeOk();
  })
  .build();
```

## Common Options

All clients accept common options like `timeout`, `signal`, and `retry`. See
[Configuration](/docs/configuration#retry-configuration) for detailed retry
settings.

### Resource Lifecycle

Register clients as resources for automatic lifecycle management. Resources are
disposed in reverse order after the scenario completes.

```typescript
.resource("http", () =>
  client.http.createHttpClient({ url: "..." })
)
// Automatically disposed when scenario ends
```

For manual control outside scenarios, use `await using`:

```typescript
await using http = client.http.createHttpClient({
  url: "http://localhost:8080",
});
// Automatically closed when scope exits
```

## HTTP Client

The HTTP client provides a fluent API for making HTTP requests with built-in
JSON handling and response assertions.

```typescript
const http = client.http.createHttpClient({
  url: "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
  throwOnError: true,
});
```

See [Configuration](/docs/configuration#http-client) for all options.

### Making Requests

The client supports all standard HTTP methods:

```typescript
// GET with query parameters
const res = await http.get("/users", {
  query: { page: 1, limit: 10 },
});

// POST with JSON body
const res = await http.post("/users", {
  name: "Alice",
  email: "alice@example.com",
});

// PUT, PATCH, DELETE
await http.put("/users/1", { name: "Alice Updated" });
await http.patch("/users/1", { email: "new@example.com" });
await http.delete("/users/1");
```

Override client settings per request:

```typescript
// Custom headers for authenticated request
const res = await http.get("/protected", {
  headers: { Authorization: "Bearer token123" },
});

// Disable error throwing for expected failures
const res = await http.get("/maybe-404", {
  throwOnError: false,
});
if (!res.ok) {
  console.log("Status:", res.status);
}
```

### Assertions

Validate responses with chainable assertions:

```typescript
expect(res)
  .toBeOk() // Status 2xx
  .toHaveStatus(200) // Exact status code
  .toHaveHeadersProperty("content-type", /application\/json/) // Content-Type pattern
  .toHaveDataMatching({ name: "Alice" }) // Partial JSON match
  .toHaveDurationLessThan(1000); // Response time limit

// Additional assertions
expect(res).not.toBeOk(); // Status not 2xx
expect(res).toHaveHeadersProperty("X-Request-Id");
expect(res).toHaveTextContaining(/success/);
expect(res).toHaveDataPresent(); // Check if response has data
```

## SQL Clients

Probitas supports multiple SQL databases with a consistent query interface.

| Database   | Client Factory                               |
| ---------- | -------------------------------------------- |
| PostgreSQL | `client.sql.postgres.createPostgresClient()` |
| MySQL      | `client.sql.mysql.createMySqlClient()`       |
| SQLite     | `client.sql.sqlite.createSqliteClient()`     |
| DuckDB     | `client.sql.duckdb.createDuckDbClient()`     |

```typescript
const pg = client.sql.postgres.createPostgresClient({
  url: {
    host: "localhost",
    port: 5432,
    database: "testdb",
    user: "testuser",
    password: "testpass",
  },
});
```

See [Configuration](/docs/configuration#postgresql-client) for all options.

### Queries

Run queries with parameterized values:

```typescript
// Simple query
const result = await pg.query("SELECT * FROM users");

// Parameterized query (type-safe)
const result = await pg.query<{ id: number; name: string }>(
  "SELECT * FROM users WHERE id = $1",
  [userId],
);

// Access results
const users = result.rows.all(); // All rows
const first = result.rows.first(); // First row
const count = result.count; // Row count
```

### Transactions

Wrap multiple queries in a transaction:

```typescript
const result = await pg.transaction(async (tx) => {
  const insert = await tx.query<{ id: number }>(
    "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
    ["Alice", "alice@example.com"],
  );

  await tx.query(
    "INSERT INTO profiles (user_id, bio) VALUES ($1, $2)",
    [insert.rows.first().id, "Hello!"],
  );

  return insert.rows.first();
});
```

### Assertions

Validate query results:

```typescript
expect(result)
  .toBeOk()
  .toHaveRowsCount(1)
  .toHaveRowsMatching({ name: "Alice" });

// Match multiple rows
expect(result).toHaveRowsMatching([
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
]);

// Additional row assertions
expect(result).toHaveRowsPresent(); // Check if query returned any rows
expect(result).toHaveRowCountGreaterThan(0); // More than 0 rows
expect(result).toHaveRowCountLessThanOrEqual(10); // At most 10 rows
```

## gRPC Client

The gRPC client supports unary calls, server streaming, client streaming, and
bidirectional streaming.

```typescript
const grpc = client.grpc.createGrpcClient({
  url: "localhost:50051",
  metadata: { authorization: "Bearer token" },
});
```

See [Configuration](/docs/configuration#grpc-client) for all options.

### Unary Calls

Standard request-response pattern:

```typescript
const res = await grpc.call("echo.EchoService", "Echo", {
  message: "Hello",
});

expect(res).toBeOk().toHaveDataMatching({ message: "Hello" });
const data = res.data();
```

### Server Streaming

Receive multiple responses from a single request:

```typescript
const messages: unknown[] = [];
for await (
  const res of grpc.serverStream("echo.EchoService", "ServerStream", {
    count: 3,
  })
) {
  expect(res).toBeOk();
  messages.push(res.data());
}
```

### Client Streaming

Send multiple requests, receive a single response:

```typescript
const res = await grpc.clientStream(
  "echo.EchoService",
  "ClientStream",
  async function* () {
    yield { message: "First" };
    yield { message: "Second" };
    yield { message: "Third" };
  },
);
expect(res).toBeOk();
```

### Bidirectional Streaming

Stream in both directions simultaneously:

```typescript
for await (
  const res of grpc.bidiStream(
    "echo.EchoService",
    "BidiStream",
    async function* () {
      yield { message: "Ping 1" };
      yield { message: "Ping 2" };
    },
  )
) {
  expect(res).toBeOk();
  console.log("Received:", res.data());
}
```

## ConnectRPC Client

The ConnectRPC client supports Connect, gRPC, and gRPC-Web protocols with a
unified API.

```typescript
const connect = client.connectrpc.createConnectRpcClient({
  url: "localhost:8080",
});
```

### Unary Calls

```typescript
const res = await connect.call("echo.EchoService", "Echo", {
  message: "Hello",
});

expect(res).toBeOk().toHaveDataMatching({ message: "Hello" });
```

### Server Streaming

```typescript
for await (
  const res of connect.serverStream("echo.EchoService", "ServerStream", {
    count: 3,
  })
) {
  expect(res).toBeOk();
  console.log("Received:", res.data());
}
```

## GraphQL Client

The GraphQL client provides methods for queries, mutations, and subscriptions.

```typescript
const graphql = client.graphql.createGraphqlClient({
  url: "http://localhost:4000/graphql",
  headers: { Authorization: "Bearer token" },
  wsUrl: "ws://localhost:4000/graphql",
});
```

See [Configuration](/docs/configuration#graphql-client) for all options.

### Queries

Fetch data with GraphQL queries:

```typescript
import { outdent } from "probitas";

const res = await graphql.query(
  outdent`
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
        email
      }
    }
  `,
  { id: "1" },
);

expect(res).toBeOk().toHaveDataMatching({
  user: { name: "Alice" },
});
const user = res.data().user;
```

### Mutations

Modify data with GraphQL mutations:

```typescript
const res = await graphql.mutate(
  outdent`
    mutation CreateUser($input: CreateUserInput!) {
      createUser(input: $input) {
        id
        name
      }
    }
  `,
  { input: { name: "Alice", email: "alice@example.com" } },
);

expect(res).toBeOk();
const newUser = res.data().createUser;
```

### Subscriptions

Listen for real-time updates:

```typescript
const subscription = graphql.subscribe(outdent`
  subscription OnUserCreated {
    userCreated {
      id
      name
    }
  }
`);

for await (const res of subscription) {
  expect(res).toBeOk();
  console.log("New user:", res.data().userCreated);
}
```

### Error and Extension Assertions

Check for GraphQL errors and extensions:

```typescript
// Check for errors
expect(res).toHaveErrorsPresent(); // Has GraphQL errors
expect(res).toHaveErrorCount(2); // Exactly 2 errors
expect(res).toHaveErrorCountGreaterThan(0); // Has at least 1 error

// Check for extensions
expect(res).toHaveExtensionsProperty("tracing"); // Has tracing extension
expect(res).toHaveExtensionsPropertyContaining("tracing", { version: 1 }); // Extension with value
```

## Redis Client

The Redis client provides operations for strings, hashes, lists, and sets.

```typescript
const redis = client.redis.createRedisClient({
  url: "redis://localhost:6379",
});
```

See [Configuration](/docs/configuration#redis-client) for all options.

### Operations

Common Redis operations:

```typescript
// Strings
await redis.set("key", "value");
await redis.set("key", "value", { ex: 3600 }); // With TTL
const result = await redis.get("key");
expect(result).toBeOk().toHaveValueMatching("value");

// Hashes
await redis.hset("user:1", { name: "Alice", age: "30" });
const user = await redis.hgetall("user:1");

// Lists
await redis.lpush("queue", "task1", "task2");
const task = await redis.rpop("queue");

// Sets
await redis.sadd("tags", "typescript", "deno");
const tags = await redis.smembers("tags");

// Delete
await redis.del("key");

// Value assertions
expect(result).toHaveValuePresent(); // Check if value exists
expect(result).toHaveValueMatching("expected"); // Match exact value
expect(result).toHaveValueContaining("substring"); // Value contains substring
expect(result).toHaveValueCount(5); // String length or collection size
```

## MongoDB Client

The MongoDB client provides document operations with a familiar API.

```typescript
const mongo = client.mongodb.createMongoClient({
  uri: "mongodb://localhost:27017",
  database: "testdb",
});
```

See [Configuration](/docs/configuration#mongodb-client) for all options.

### Operations

Work with collections and documents:

```typescript
const users = mongo.collection<User>("users");

// Insert
const result = await users.insertOne({
  name: "Alice",
  email: "alice@example.com",
});
expect(result).toBeOk();

// Find
const user = await users.findOne({ _id: result.insertedId });
expect(user).toBeOk().toHaveDocMatching({ name: "Alice" });

// Find many
const allUsers = await users.find({ age: { $gte: 18 } }).toArray();

// Update
await users.updateOne(
  { _id: result.insertedId },
  { $set: { name: "Bob" } },
);

// Delete
await users.deleteOne({ _id: result.insertedId });

// Document assertions
expect(result).toHaveDocsPresent(); // Check if documents were returned
expect(result).toHaveDocsCount(5); // Exactly 5 documents
expect(result).toHaveDocsMatching([...]); // Match multiple documents
expect(result).toHaveInsertedCount(1); // 1 document inserted
expect(result).toHaveModifiedCount(1); // 1 document modified
expect(result).toHaveDeletedCount(1); // 1 document deleted
```

## Deno KV Client

The Deno KV client provides access to Deno's built-in key-value store.

```typescript
const kv = client.deno_kv.createDenoKvClient();
```

By default, an in-memory database is used for testing.

### Operations

```typescript
// Set and get
await kv.set(["users", "1"], { name: "Alice" });
const result = await kv.get(["users", "1"]);
expect(result).toBeOk().toHaveValueMatching({ name: "Alice" });

// List by prefix
const users = await kv.list({ prefix: ["users"] });
for await (const entry of users) {
  console.log(entry.key, entry.value);
}

// Atomic operations
const atomic = kv.atomic();
atomic
  .check({ key: ["users", "1"], versionstamp: null })
  .set(["users", "1"], { name: "Alice" });
const commitResult = await atomic.commit();

// Delete
await kv.delete(["users", "1"]);
```

## RabbitMQ Client

The RabbitMQ client provides AMQP messaging for publish/subscribe patterns.

```typescript
const rabbitmq = client.rabbitmq.createRabbitMqClient({
  url: "amqp://guest:guest@localhost:5672",
});
```

See [Configuration](/docs/configuration#rabbitmq-client) for all options.

### Operations

```typescript
const channel = await rabbitmq.channel();

// Declare queue
await channel.assertQueue("my-queue", { durable: false });

// Send message
const content = new TextEncoder().encode(JSON.stringify({ message: "Hello" }));
await channel.sendToQueue("my-queue", content);

// Receive message
const result = await channel.get("my-queue");
expect(result).toBeOk();
if (result.message) {
  await channel.ack(result.message);
}

await channel.close();
```

## SQS Client

The AWS SQS client provides cloud message queue operations.

```typescript
const sqs = client.sqs.createSqsClient({
  endpoint: "http://localhost:4566", // LocalStack or AWS endpoint
  region: "us-east-1",
  credentials: {
    accessKeyId: "...",
    secretAccessKey: "...",
  },
});
```

See [Configuration](/docs/configuration#sqs-client) for all options.

### Operations

```typescript
// Ensure queue exists
await sqs.ensureQueue("my-queue");

// Send message
const result = await sqs.send(JSON.stringify({ event: "user.created" }));
expect(result).toBeOk().toHaveMessageId();

// Receive and process
const messages = await sqs.receive({ maxMessages: 10 });
for (const msg of messages) {
  console.log("Received:", msg.body);
  await msg.delete();
}
```

## Available Clients

| Client     | Factory Function                             | Use Case             |
| ---------- | -------------------------------------------- | -------------------- |
| HTTP       | `client.http.createHttpClient()`             | REST APIs, webhooks  |
| PostgreSQL | `client.sql.postgres.createPostgresClient()` | PostgreSQL databases |
| MySQL      | `client.sql.mysql.createMySqlClient()`       | MySQL databases      |
| SQLite     | `client.sql.sqlite.createSqliteClient()`     | Embedded databases   |
| DuckDB     | `client.sql.duckdb.createDuckDbClient()`     | Analytics databases  |
| gRPC       | `client.grpc.createGrpcClient()`             | gRPC services        |
| ConnectRPC | `client.connectrpc.createConnectRpcClient()` | Connect/gRPC-Web     |
| GraphQL    | `client.graphql.createGraphqlClient()`       | GraphQL APIs         |
| Redis      | `client.redis.createRedisClient()`           | Cache, pub/sub       |
| MongoDB    | `client.mongodb.createMongoClient()`         | Document databases   |
| Deno KV    | `client.deno_kv.createDenoKvClient()`        | Deno KV store        |
| RabbitMQ   | `client.rabbitmq.createRabbitMqClient()`     | AMQP message queues  |
| SQS        | `client.sqs.createSqsClient()`               | AWS message queues   |

## Best Practices

### Register Clients as Resources

Always register clients as resources for automatic cleanup:

```typescript
// Good - automatic lifecycle management
.resource("http", () => client.http.createHttpClient(...))

// Avoid - manual cleanup required
.step("Make request", async () => {
  const http = client.http.createHttpClient(...);
  // Must manually dispose
})
```

### Use Type Parameters

Provide type parameters for type-safe responses:

```typescript
// Good - typed response
const result = await pg.query<{ id: number; name: string }>(
  "SELECT id, name FROM users WHERE id = $1",
  [userId],
);
const user = result.rows.first(); // Type: { id: number; name: string }

// Avoid - untyped response
const result = await pg.query("SELECT * FROM users");
```

### Handle Errors Appropriately

Use assertions for expected successes, explicit checks for expected failures:

```typescript
// Expected success - use assertions
const res = await http.get("/users/1");
expect(res).toBeOk().toHaveStatus(200);

// Expected failure - disable throwing, check manually
const res = await http.get("/users/nonexistent", { throwOnError: false });
expect(res).toHaveStatus(404);
```

### Configure Retries

Use retry configuration for network-dependent operations. See
[Configuration](/docs/configuration#retry-configuration) for all retry options.

```typescript
.step("External API call", async (ctx) => {
  const { http } = ctx.resources;
  const res = await http.get("/external-api", {
    retry: { maxAttempts: 3, backoff: "exponential" },
  });
  expect(res).toBeOk();
}, {
  timeout: 10000, // Allow time for retries
})
```
