import { defineConfig } from "drizzle-kit";

// @ts-ignore TODO: fix this
import { env } from "./src/lib/env";

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
