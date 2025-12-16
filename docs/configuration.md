# Configuration

Learn how to configure Probitas scenarios, steps, and clients. This guide covers
all available options and common configuration patterns.

## Project Configuration

Configure Probitas CLI defaults in your `deno.json` or `deno.jsonc` file under
the `probitas` section:

```json
{
  "imports": {
    "probitas": "jsr:@probitas/probitas@^0"
  },
  "probitas": {
    "reporter": "list",
    "includes": ["**/*.probitas.ts"],
    "excludes": [],
    "selectors": ["!tag:slow"],
    "maxConcurrency": 4,
    "maxFailures": 5
  }
}
```

| Option           | Description                               | Default                |
| ---------------- | ----------------------------------------- | ---------------------- |
| `reporter`       | Output reporter: `list`, `json`           | `"list"`               |
| `includes`       | Glob patterns for scenario file discovery | `["**/*.probitas.ts"]` |
| `excludes`       | Glob patterns to exclude from discovery   | `[]`                   |
| `selectors`      | Default selectors for filtering scenarios | `[]`                   |
| `maxConcurrency` | Maximum parallel scenario execution       | unlimited              |
| `maxFailures`    | Stop after this many failures             | unlimited              |

### Selectors

Selectors filter which scenarios to run. The format is `[!][type:]value`:

| Type   | Description                      | Example                 |
| ------ | -------------------------------- | ----------------------- |
| `tag`  | Match by scenario tag            | `tag:api`               |
| `name` | Match by scenario name (default) | `Login` or `name:Login` |
| `!`    | Negation prefix                  | `!tag:slow`             |

Multiple selectors use OR logic. Comma-separated values within a selector use
AND logic:

```json
{
  "probitas": {
    "selectors": ["tag:api,!tag:slow"]
  }
}
```

This runs scenarios with `api` tag AND without `slow` tag.

### CLI Override

Command-line options override `deno.json` settings:

```bash
# Override reporter
probitas run --reporter json

# Override concurrency
probitas run --max-concurrency 1

# Add selectors (combined with config selectors)
probitas run -s tag:smoke
```

## Scenario Options

Configure scenarios using the options parameter of `scenario()`.

```typescript
scenario("My Test", {
  tags: ["api", "integration"],
  stepOptions: {
    timeout: 60000,
    retry: { maxAttempts: 3, backoff: "exponential" },
  },
});
```

| Option                          | Description                                     | Default    |
| ------------------------------- | ----------------------------------------------- | ---------- |
| `tags`                          | Tags for filtering scenarios during runs        | `[]`       |
| `stepOptions.timeout`           | Default timeout for all steps (ms)              | `30000`    |
| `stepOptions.retry.maxAttempts` | Default max retry attempts for steps            | `1`        |
| `stepOptions.retry.backoff`     | Backoff strategy: `"linear"` or `"exponential"` | `"linear"` |

### Tags

Use tags to categorize and filter scenarios:

```typescript
scenario("API Integration", {
  tags: ["api", "integration", "slow"],
});
```

Run scenarios by tag using selectors:

```bash
# Run only "api" tagged scenarios
probitas run -s tag:api

# Exclude "slow" scenarios
probitas run -s "!tag:slow"

# Combine filters (AND logic)
probitas run -s "tag:api,!tag:slow"
```

## Step Options

Override scenario defaults for individual steps:

```typescript
scenario("Mixed Timeouts")
  .step("Quick check", async (ctx) => {
    // Must complete in 1 second
  }, { timeout: 1000 })
  .step("Slow operation", async (ctx) => {
    // Can take up to 60 seconds
  }, { timeout: 60000 })
  .step("Flaky external call", async (ctx) => {
    // Retry up to 5 times with exponential backoff
  }, {
    retry: { maxAttempts: 5, backoff: "exponential" },
  })
  .build();
```

| Option              | Description                          |
| ------------------- | ------------------------------------ |
| `timeout`           | Step timeout in milliseconds         |
| `retry.maxAttempts` | Maximum retry attempts for this step |
| `retry.backoff`     | Backoff strategy for this step       |

### Timeout Behavior

When a step times out:

1. The step's `ctx.signal` is aborted
2. The step fails with `TimeoutError`
3. Retry logic applies if configured
4. Cleanup hooks still execute

```typescript
.step("Cancellable operation", async (ctx) => {
  // Pass signal to cancellable operations
  const response = await fetch(url, { signal: ctx.signal });
  return response.json();
}, { timeout: 5000 })
```

## Retry Configuration

Configure automatic retries for flaky operations.

| Option         | Description                          | Default |
| -------------- | ------------------------------------ | ------- |
| `maxAttempts`  | Maximum number of attempts           | `1`     |
| `backoff`      | `"linear"` or `"exponential"`        | —       |
| `initialDelay` | First retry delay (ms)               | `1000`  |
| `maxDelay`     | Maximum delay between retries (ms)   | `30000` |
| `retryOn`      | Custom predicate for retry decisions | —       |

### Backoff Strategies

| Strategy        | Delay Pattern     |
| --------------- | ----------------- |
| `"linear"`      | 1s, 2s, 3s, 4s... |
| `"exponential"` | 1s, 2s, 4s, 8s... |

### Custom Retry Logic

```typescript
const res = await http.get("/endpoint", {
  retry: {
    maxAttempts: 3,
    backoff: "exponential",
    initialDelay: 500,
    maxDelay: 10000,
    retryOn: (error) => {
      // Only retry on network errors
      return error.kind === "connection" || error.kind === "timeout";
    },
  },
});
```

## Client Configurations

### HTTP Client

```typescript
client.http.createHttpClient({
  url: "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
  throwOnError: true,
  timeout: 10000,
});
```

| Option         | Description                          | Default    |
| -------------- | ------------------------------------ | ---------- |
| `url`          | Base URL for all requests (required) | —          |
| `headers`      | Default headers for all requests     | `{}`       |
| `throwOnError` | Throw on 4xx/5xx responses           | `true`     |
| `timeout`      | Request timeout (ms)                 | —          |
| `redirect`     | `"follow"`, `"manual"`, or `"error"` | `"follow"` |

### PostgreSQL Client

```typescript
client.sql.postgres.createPostgresClient({
  url: {
    host: "localhost",
    port: 5432,
    database: "testdb",
    user: "testuser",
    password: "testpass",
  },
  pool: { min: 1, max: 10 },
});
```

| Option             | Description                        | Default |
| ------------------ | ---------------------------------- | ------- |
| `url`              | Connection string or config object | —       |
| `pool.min`         | Minimum pool connections           | `0`     |
| `pool.max`         | Maximum pool connections           | `10`    |
| `pool.idleTimeout` | Idle connection timeout (ms)       | `30000` |

Connection can also be a URL string:

```typescript
client.sql.postgres.createPostgresClient({
  url: "postgres://user:pass@localhost:5432/mydb",
});
```

### gRPC Client

```typescript
client.grpc.createGrpcClient({
  url: "localhost:50051",
  metadata: { authorization: "Bearer token" },
  tls: { insecure: false },
});
```

| Option     | Description                    | Default        |
| ---------- | ------------------------------ | -------------- |
| `url`      | Server address (host:port)     | —              |
| `metadata` | Default metadata for all calls | `{}`           |
| `tls`      | TLS configuration              | —              |
| `schema`   | Proto schema source            | `"reflection"` |

### GraphQL Client

```typescript
client.graphql.createGraphqlClient({
  url: "http://localhost:4000/graphql",
  headers: { Authorization: "Bearer token" },
  wsUrl: "ws://localhost:4000/graphql",
});
```

| Option         | Description                          | Default |
| -------------- | ------------------------------------ | ------- |
| `url`          | GraphQL HTTP endpoint (required)     | —       |
| `headers`      | Default headers                      | `{}`    |
| `wsUrl`        | WebSocket endpoint for subscriptions | —       |
| `throwOnError` | Throw on GraphQL errors              | `true`  |

### Redis Client

```typescript
client.redis.createRedisClient({
  url: "redis://localhost:6379",
});
```

| Option | Description                              | Default                    |
| ------ | ---------------------------------------- | -------------------------- |
| `url`  | Redis connection URL (redis://host:port) | `"redis://localhost:6379"` |

### MongoDB Client

```typescript
client.mongodb.createMongoClient({
  uri: "mongodb://localhost:27017",
  database: "testdb",
});
```

| Option     | Description            | Default |
| ---------- | ---------------------- | ------- |
| `uri`      | MongoDB connection URI | —       |
| `database` | Default database name  | —       |

### RabbitMQ Client

```typescript
client.rabbitmq.createRabbitMqClient({
  url: "amqp://guest:guest@localhost:5672",
});
```

| Option | Description         | Default              |
| ------ | ------------------- | -------------------- |
| `url`  | AMQP connection URL | `"amqp://localhost"` |

### SQS Client

```typescript
client.sqs.createSqsClient({
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});
```

| Option        | Description               | Default |
| ------------- | ------------------------- | ------- |
| `endpoint`    | SQS endpoint URL          | —       |
| `region`      | AWS region                | —       |
| `credentials` | AWS access key and secret | —       |

## Environment Variables

Probitas respects these environment variables:

| Variable   | Purpose                |
| ---------- | ---------------------- |
| `NO_COLOR` | Disable colored output |

### Using Environment Variables

```typescript
scenario("Production Test")
  .resource("http", () =>
    client.http.createHttpClient({
      url: Deno.env.get("API_URL") ?? "http://localhost:8080",
      headers: {
        Authorization: `Bearer ${Deno.env.get("API_TOKEN")}`,
      },
    }))
  .resource("pg", () =>
    client.sql.postgres.createPostgresClient({
      url: Deno.env.get("DATABASE_URL") ??
        "postgres://user:pass@localhost/testdb",
    }))
  .build();
```

## Configuration Patterns

### Environment-Aware Configuration

```typescript
const isProduction = Deno.env.get("ENV") === "production";

scenario("API Test")
  .resource("http", () =>
    client.http.createHttpClient({
      url: isProduction ? "https://api.example.com" : "http://localhost:8080",
      timeout: isProduction ? 30000 : 5000,
      retry: isProduction
        ? { maxAttempts: 3, backoff: "exponential" }
        : undefined,
    }))
  .build();
```

### Shared Configuration

```typescript
// config.ts
export const httpDefaults = {
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
};

export const dbDefaults = {
  timeout: 10000,
  pool: { min: 1, max: 5 },
};

// scenario.ts
import { dbDefaults, httpDefaults } from "./config.ts";

scenario("Test")
  .resource("http", () =>
    client.http.createHttpClient({
      url: "http://localhost:8080",
      ...httpDefaults,
    }))
  .resource("pg", () =>
    client.sql.postgres.createPostgresClient({
      url: "postgres://...",
      ...dbDefaults,
    }))
  .build();
```

### Resource Factory Pattern

```typescript
// factories.ts
export function createApiClient(url?: string) {
  return client.http.createHttpClient({
    url: url ?? Deno.env.get("API_URL") ?? "http://localhost:8080",
    timeout: 10000,
    retry: { maxAttempts: 2 },
  });
}

export function createTestDatabase() {
  return client.sql.postgres.createPostgresClient({
    url: {
      host: Deno.env.get("DB_HOST") ?? "localhost",
      port: Number(Deno.env.get("DB_PORT") ?? 5432),
      database: "testdb",
      user: "testuser",
      password: "testpass",
    },
  });
}

// scenario.ts
import { createApiClient, createTestDatabase } from "./factories.ts";

scenario("Test")
  .resource("http", createApiClient)
  .resource("pg", createTestDatabase)
  .build();
```

### Conditional Resources

```typescript
import { Skip } from "probitas";

scenario("Conditional Features")
  .resource("http", () => createHttpClient(...))
  .resource("redis", () => {
    const redisUrl = Deno.env.get("REDIS_URL");
    if (!redisUrl) {
      throw new Skip("Redis not configured");
    }
    return client.redis.createRedisClient({
      url: redisUrl,
    });
  })
  .build();
```
