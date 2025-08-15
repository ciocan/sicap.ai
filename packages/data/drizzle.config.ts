import { defineConfig } from "drizzle-kit";

import { env } from "./src/lib/env.js";

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
  migrations: {
    table: "__drizzle_migrations",
  },
});
