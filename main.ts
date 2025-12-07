import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Probitas Documentation</title>
      </head>
      <body>
        <h1>Probitas</h1>
        <p>A scenario-based testing framework for Deno.</p>
      </body>
    </html>
  `);
});

Deno.serve(app.fetch);
