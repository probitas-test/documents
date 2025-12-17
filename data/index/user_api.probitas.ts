import { client, expect, faker, scenario } from "jsr:@probitas/probitas";

export default scenario("User API Integration Test", {
  tags: ["integration", "http", "postgres"],
})
  .resource("user", () => ({
    id: faker.random.uuid(),
    name: faker.name.findName(),
    email: faker.internet.email(),
  }))
  .resource("db", () =>
    client.sql.postgres.createPostgresClient({
      url: {
        host: "localhost",
        port: 5432,
        database: "app",
        username: "testuser",
        password: "testpassword",
      },
    }))
  .resource("http", () =>
    client.http.createHttpClient({
      url: "http://localhost:8000",
    }))
  .setup(async (ctx) => {
    const { db, user } = ctx.resources;
    await db.query(
      `INSERT INTO users (id, name, email) VALUES ($1, $2, $3)`,
      [user.id, user.name, user.email],
    );
    return async () => {
      await db.query(`DELETE FROM users WHERE id = $1`, [user.id]);
    };
  })
  .step("GET /users/:id - fetch user", async (ctx) => {
    const { http, user } = ctx.resources;
    const res = await http.get(`/users/${user.id}`);

    expect(res)
      .toBeOk()
      .toHaveStatus(200)
      .toHaveDataMatching({ id: user.id, name: user.name });
  })
  .build();
