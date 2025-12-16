# Scenario

Learn how to write effective Probitas scenarios with this comprehensive guide
covering the builder API, step context, resources, and best practices.

## Basic Structure

A Probitas scenario follows this structure:

```typescript
import { client, expect, scenario } from "probitas";

export default scenario("User API CRUD", {
  tags: ["integration", "api"],
})
  .resource("http", () =>
    client.http.createHttpClient({
      url: "http://localhost:8080",
    }))
  .setup(async (ctx) => {
    // Create test user before steps
    const { http } = ctx.resources;
    await http.post("/users", { name: "test-user" });

    return async () => {
      // Cleanup: delete test user after steps
      await http.delete("/users/test-user");
    };
  })
  .step("Get user", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.get("/users/test-user");
    expect(res).toHaveStatus(200);
    return res.json();
  })
  .build();
```

### Export Pattern

Scenarios must be exported as the default export:

```typescript
// Single scenario
export default scenario("Name").step(...).build();
```

You can also export multiple scenarios as an array:

```typescript
// Multiple scenarios
export default [
  scenario("First").step(...).build(),
  scenario("Second").step(...).build(),
];
```

## Scenario Builder API

### `scenario(name, options?)`

Creates a new scenario builder.

| Parameter  | Type     | Description                             |
| ---------- | -------- | --------------------------------------- |
| `name`     | `string` | Human-readable identifier for your test |
| `options?` | `object` | Optional configuration (see below)      |

See [Configuration](/docs/configuration) for detailed options including tags,
timeout, and retry settings.

### `.step(name?, fn, options?)`

Adds a step to the scenario. Steps run sequentially, and each receives the
result of the previous step.

| Parameter  | Type         | Description                                                                        |
| ---------- | ------------ | ---------------------------------------------------------------------------------- |
| `name?`    | `string`     | Optional step name (auto-generated as "Step 1", "Step 2" if omitted)               |
| `fn`       | `(ctx) => T` | Async function that receives a context object and returns a result                 |
| `options?` | `object`     | Per-step timeout and retry (see [Configuration](/docs/configuration#step-options)) |

```typescript
// Named step
.step("Step name", async (ctx) => {
  return result;
})

// Unnamed step (auto-named as "Step 1", "Step 2", etc.)
.step(async (ctx) => {
  return result;
})

// With options
.step("Step name", async (ctx) => {
  return result;
}, {
  timeout: 5000,
  retry: { maxAttempts: 3, backoff: "exponential" }
})
```

### `.resource(name, factory, options?)`

Registers a resource with lifecycle management. Resources are created before
steps run and automatically disposed after the scenario completes.

| Parameter  | Type         | Description                                                                            |
| ---------- | ------------ | -------------------------------------------------------------------------------------- |
| `name`     | `string`     | Name to access this resource via `ctx.resources.name`                                  |
| `factory`  | `(ctx) => T` | Function that creates and returns the resource                                         |
| `options?` | `object`     | Per-resource timeout and retry (see [Configuration](/docs/configuration#step-options)) |

```typescript
.resource("http", () =>
  client.http.createHttpClient({
    url: "http://localhost:8080",
  })
)

// With options
.resource("db", () =>
  client.sql.postgres.createPostgresClient({ ... }),
  { timeout: 10000 }
)
```

#### Resource Behavior

- Resources are initialized in declaration order
- Resources implementing `Disposable` or `AsyncDisposable` are auto-disposed
- Resources are available to subsequent steps, setups, and other resources
- Disposal happens in reverse order after scenario completion

### `.setup(name?, fn, options?)`

Registers a setup hook that runs before steps. Can return a cleanup function
that runs after all steps complete (even on failure).

| Parameter  | Type                | Description                                                                         |
| ---------- | ------------------- | ----------------------------------------------------------------------------------- |
| `name?`    | `string`            | Optional setup name (auto-generated as "Setup step 1", etc. if omitted)             |
| `fn`       | `(ctx) => Cleanup?` | Setup function that optionally returns a cleanup function or Disposable             |
| `options?` | `object`            | Per-setup timeout and retry (see [Configuration](/docs/configuration#step-options)) |

```typescript
// Named setup with cleanup function
.setup("Seed test data", async (ctx) => {
  const { db } = ctx.resources;
  await db.query("INSERT INTO test_data ...");

  return async () => {
    await db.query("DELETE FROM test_data ...");
  };
})

// Unnamed setup (auto-named as "Setup step 1", etc.)
.setup(async (ctx) => {
  const { db } = ctx.resources;
  await db.query("INSERT INTO test_data ...");
})

// Setup with Disposable
.setup((ctx) => {
  const resource = createResource();
  return {
    [Symbol.dispose]() {
      resource.close();
    }
  };
})

// Setup with options
.setup("Long setup", async (ctx) => {
  await prepareTestEnvironment();
}, { timeout: 60000 })
```

### `.build()`

Finalizes the scenario and returns an immutable definition. Always call this at
the end of the builder chain.

## Step Context

Every step, resource factory, and setup function receives a context object
(`ctx`) with these properties:

| Property    | Type          | Description                                                  |
| ----------- | ------------- | ------------------------------------------------------------ |
| `previous`  | `T`           | Return value from the immediately preceding step             |
| `results`   | `tuple`       | Tuple containing ALL previous step results in order          |
| `resources` | `object`      | Object containing all registered resources by name           |
| `store`     | `Map`         | Shared Map that persists across all steps                    |
| `signal`    | `AbortSignal` | Fires when the step times out; pass to cancelable operations |
| `index`     | `number`      | Zero-based index of the current step                         |

### `ctx.previous`

Use this to chain data between steps:

```typescript
.step("Create user", async (ctx) => {
  return { id: 1, name: "Alice" };
})
.step("Update user", async (ctx) => {
  const user = ctx.previous; // { id: 1, name: "Alice" }
  return { ...user, updated: true };
})
```

### `ctx.results`

Useful when you need data from steps other than the immediately previous one:

```typescript
.step("Step 1", () => "first")
.step("Step 2", () => 42)
.step("Step 3", (ctx) => {
  const [step1, step2] = ctx.results;
  // step1: "first"
  // step2: 42
})
```

### `ctx.resources`

Access registered resources:

```typescript
.resource("http", () => createHttpClient(...))
.resource("db", () => createPostgresClient(...))
.step("Use resources", async (ctx) => {
  const { http, db } = ctx.resources;
  // Both clients are available
})
```

### `ctx.store`

Pass data that doesn't fit the step return value pattern:

```typescript
.step("Save to store", (ctx) => {
  ctx.store.set("key", "value");
})
.step("Read from store", (ctx) => {
  const value = ctx.store.get("key"); // "value"
})
```

### `ctx.signal`

Pass to fetch calls or other cancelable operations:

```typescript
.step("Long operation", async (ctx) => {
  const response = await fetch(url, { signal: ctx.signal });
  return response.json();
})
```

## Resources

Resources are dependencies like database connections or HTTP clients that need
proper setup and teardown.

### Basic Pattern

Register a resource with a factory function. The resource becomes available to
all subsequent steps via `ctx.resources`.

```typescript
.resource("name", (ctx) => {
  // Create and return resource
  return client.http.createHttpClient({ url: "..." });
})
```

### Resource Dependencies

Resources can depend on earlier resources. They're created in declaration order.

```typescript
.resource("config", () => ({
  url: Deno.env.get("API_URL") ?? "http://localhost:8080",
}))
.resource("http", (ctx) => {
  const { config } = ctx.resources;
  return client.http.createHttpClient({ url: config.url });
})
```

### Auto-Disposal

All Probitas clients implement `AsyncDisposable`, so they're automatically
cleaned up when the scenario ends.

```typescript
// All Probitas clients implement AsyncDisposable
.resource("http", () => client.http.createHttpClient(...))
// Automatically disposed after scenario completes
```

## Setup and Cleanup

Setup hooks prepare the test environment before steps run. Cleanup functions
restore the environment afterward.

### Multiple Setups

You can chain multiple setup hooks. Each can return a cleanup function.

```typescript
scenario("Multi-setup")
  .resource("db", () => createPostgresClient(...))
  .setup(async (ctx) => {
    // First setup: create schema
    await ctx.resources.db.query("CREATE TABLE IF NOT EXISTS ...");
  })
  .setup(async (ctx) => {
    // Second setup: seed data
    await ctx.resources.db.query("INSERT INTO ...");
    return async () => {
      // Cleanup: remove seeded data
      await ctx.resources.db.query("DELETE FROM ...");
    };
  })
  .step("Test with data", async (ctx) => {
    // Schema and data are ready
  })
  .build();
```

### Cleanup Order

Cleanup functions run in **reverse order** (last setup's cleanup runs first).
This ensures proper teardown of dependent resources.

```typescript
.setup(() => {
  console.log("Setup 1");
  return () => console.log("Cleanup 1"); // Runs last
})
.setup(() => {
  console.log("Setup 2");
  return () => console.log("Cleanup 2"); // Runs first
})

// Output:
// Setup 1
// Setup 2
// (steps run)
// Cleanup 2
// Cleanup 1
```

## Skip and Error Handling

### Skipping Scenarios

Throw `Skip` to conditionally skip the remaining steps. This is useful for
environment-specific tests.

```typescript
import { Skip } from "probitas";

.step("Check precondition", () => {
  if (!Deno.env.get("INTEGRATION_ENABLED")) {
    throw new Skip("Integration tests disabled");
  }
})
.step("Integration test", async (ctx) => {
  // This step is skipped if Skip was thrown
})
```

You can also skip from resources or setup hooks:

```typescript
.resource("external", () => {
  if (!checkExternalService()) {
    throw new Skip("External service unavailable");
  }
  return createExternalClient();
})
```

### Error Handling

When a step throws an error, the scenario fails but **cleanup still runs**. This
ensures resources are properly disposed.

```typescript
.setup(() => {
  return () => console.log("Cleanup runs even on error");
})
.step("Failing step", () => {
  throw new Error("Step failed");
})
// Cleanup still executes
```

### Retry on Failure

For flaky operations, configure automatic retries. See
[Configuration](/docs/configuration#retry-configuration) for detailed retry
options.

```typescript
.step("Flaky operation", async (ctx) => {
  const res = await http.get("/sometimes-fails");
  expect(res).toBeOk();
  return res.json();
}, {
  retry: { maxAttempts: 3, backoff: "exponential" }
})
```

## Complete Examples

### HTTP API Testing

A typical CRUD test that creates, reads, updates, and deletes a resource.

```typescript
import { client, expect, scenario } from "probitas";

export default scenario("User CRUD API", { tags: ["api", "integration"] })
  .resource("http", () =>
    client.http.createHttpClient({
      url: "http://localhost:8080",
    }))
  .step("Create user", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.post("/users", {
      name: "Alice",
      email: "alice@example.com",
    });
    expect(res).toBeOk().toHaveStatus(201).toHaveDataMatching({
      name: "Alice",
    });
    return res.json<{ id: number }>();
  })
  .step("Get user", async (ctx) => {
    const { http } = ctx.resources;
    const { id } = ctx.previous;
    const res = await http.get(`/users/${id}`);
    expect(res).toBeOk().toHaveStatus(200).toHaveDataMatching({
      id,
      name: "Alice",
    });
    return res.json();
  })
  .step("Update user", async (ctx) => {
    const { http } = ctx.resources;
    const { id } = ctx.previous;
    const res = await http.patch(`/users/${id}`, { name: "Bob" });
    expect(res).toBeOk().toHaveStatus(200).toHaveDataMatching({
      name: "Bob",
    });
    return { id };
  })
  .step("Delete user", async (ctx) => {
    const { http } = ctx.resources;
    const { id } = ctx.previous;
    const res = await http.delete(`/users/${id}`);
    expect(res).toBeOk().toHaveStatus(204);
  })
  .build();
```

### Database Integration

Testing database operations with setup/cleanup for table management.

```typescript
import { client, expect, scenario } from "probitas";

export default scenario("Database Transaction", { tags: ["db", "postgres"] })
  .resource("pg", () =>
    client.sql.postgres.createPostgresClient({
      url: {
        host: "localhost",
        port: 5432,
        database: "testdb",
        user: "testuser",
        password: "testpass",
      },
    }))
  .setup(async (ctx) => {
    const { pg } = ctx.resources;
    await pg.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      )
    `);
    return async () => {
      await pg.query("DROP TABLE IF EXISTS users");
    };
  })
  .step("Insert user with transaction", async (ctx) => {
    const { pg } = ctx.resources;
    const result = await pg.transaction(async (tx) => {
      const insert = await tx.query<{ id: number }>(
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
        ["Alice", "alice@example.com"],
      );
      return insert.rows.first();
    });
    return result;
  })
  .step("Verify user exists", async (ctx) => {
    const { pg } = ctx.resources;
    const { id } = ctx.previous;
    const result = await pg.query<{ name: string }>(
      "SELECT name FROM users WHERE id = $1",
      [id],
    );
    expect(result).toBeOk().toHaveRowCount(1).toHaveRowsMatching({
      name: "Alice",
    });
  })
  .build();
```

### gRPC Service Testing

Testing gRPC services including unary calls and streaming.

```typescript
import { client, expect, scenario } from "probitas";

export default scenario("gRPC Echo Service", { tags: ["grpc"] })
  .resource("grpc", () =>
    client.grpc.createGrpcClient({
      url: "localhost:50051",
    }))
  .step("Unary call", async (ctx) => {
    const { grpc } = ctx.resources;
    const res = await grpc.call("echo.EchoService", "Echo", {
      message: "Hello",
    });
    expect(res).toBeOk().toHaveDataMatching({ message: "Hello" });
    return res.data();
  })
  .step("Server streaming", async (ctx) => {
    const { grpc } = ctx.resources;
    const messages: unknown[] = [];
    for await (
      const res of grpc.serverStream("echo.EchoService", "ServerStream", {
        count: 3,
      })
    ) {
      expect(res).toBeOk();
      messages.push(res.data());
    }
    return messages;
  })
  .build();
```

### Multi-Client Scenario

Combining multiple clients (HTTP, database, Redis) in a single end-to-end test.

```typescript
import { client, expect, scenario, Skip } from "probitas";

export default scenario("Full Stack Test", {
  tags: ["integration", "e2e"],
})
  .resource("http", () =>
    client.http.createHttpClient({
      url: "http://localhost:8080",
    }))
  .resource("pg", () =>
    client.sql.postgres.createPostgresClient({
      url: {
        host: "localhost",
        port: 5432,
        database: "testdb",
        user: "testuser",
        password: "testpass",
      },
    }))
  .resource("redis", () =>
    client.redis.createRedisClient({
      url: "redis://localhost:6379",
    }))
  .setup(async (ctx) => {
    const { redis } = ctx.resources;
    await redis.set("api:enabled", "true");
    return async () => {
      await redis.del("api:enabled");
    };
  })
  .step("Check API enabled", async (ctx) => {
    const { redis } = ctx.resources;
    const result = await redis.get("api:enabled");
    if (result.value !== "true") {
      throw new Skip("API is disabled");
    }
  })
  .step("Create via API", async (ctx) => {
    const { http } = ctx.resources;
    const res = await http.post("/items", { name: "Test Item" });
    expect(res).toBeOk().toHaveStatus(201);
    return res.json<{ id: number }>();
  })
  .step("Verify in database", async (ctx) => {
    const { pg } = ctx.resources;
    const { id } = ctx.previous;
    const result = await pg.query(
      "SELECT * FROM items WHERE id = $1",
      [id],
    );
    expect(result).toBeOk().toHaveRowCount(1).toHaveRowsMatching({
      name: "Test Item",
    });
  })
  .build();
```

## Best Practices

### Use Descriptive Step Names

Good names make test output readable and debugging easier.

```typescript
// Good
.step("Create user with valid email", ...)
.step("Verify email confirmation sent", ...)

// Avoid
.step("Step 1", ...)
.step("Test", ...)
```

### Return Meaningful Values

Return data that subsequent steps need. This enables type-safe data flow through
`ctx.previous`.

```typescript
// Good - returns data needed by next step
.step("Create user", async (ctx) => {
  const res = await http.post("/users", data);
  return res.json<{ id: number }>();
})

// Avoid - loses useful data
.step("Create user", async (ctx) => {
  await http.post("/users", data);
})
```

### Use Tags for Filtering

Tags let you run subsets of tests (e.g., only fast tests, or only tests that
don't need Docker).

```typescript
scenario("Slow Integration Test", {
  tags: ["integration", "slow", "requires-docker"],
});
```

### Keep Steps Focused

Each step should do one thing. This makes failures easier to diagnose and tests
easier to maintain.

```typescript
// Good - single responsibility
.step("Create order", ...)
.step("Process payment", ...)
.step("Send confirmation", ...)

// Avoid - too many concerns
.step("Create order, process payment, and send confirmation", ...)
```

### Use Setup for Test Data

Setup hooks with cleanup are better than steps for managing test fixtures. They
guarantee cleanup even on failure.

```typescript
// Good - setup manages test data lifecycle
.setup(async (ctx) => {
  await seedTestData(ctx.resources.db);
  return () => cleanupTestData(ctx.resources.db);
})

// Avoid - pollutes step logic
.step("Setup test data", async (ctx) => {
  await seedTestData(ctx.resources.db);
})
```
