---
paths: "docs/**/*.md"
---

# Documentation Content Guidelines

## Writing Style

- **Concise** - Get to the point quickly
- **Practical** - Focus on real-world usage
- **Progressive** - Simple concepts before complex ones

## Code Examples

Every concept needs a runnable example:

```typescript
import { client, expect, scenario } from "jsr:@probitas/probitas";

export default scenario("Example")
  .resource("http", () =>
    client.http.createHttpClient({ url: "http://localhost:8080" }))
  .step("make request", async (ctx) => {
    const res = await ctx.resources.http.get("/api/users");
    expect(res).toBeOk().toHaveStatus(200);
  })
  .build();
```

## Package Documentation

| Repository         | Packages                                    |
| ------------------ | ------------------------------------------- |
| `probitas/`        | Core: probitas, builder, runner, reporter   |
| `probitas-client/` | Clients: http, grpc, graphql, redis, sql... |
