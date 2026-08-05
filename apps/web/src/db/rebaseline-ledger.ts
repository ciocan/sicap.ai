import { createClient } from "@libsql/client";
import { readMigrationFiles } from "drizzle-orm/migrator";

import { env } from "@/lib/env";

// One-time re-baseline helper. After the database was already migrated to the
// Better Auth schema (via db:migrate:betterauth) and the Drizzle migration history
// was regenerated into a single baseline, an EXISTING database's `__drizzle_migrations`
// ledger still references the old, now-deleted NextAuth migrations. This stamps the
// regenerated baseline as already-applied so `db:migrate` won't try to recreate
// existing tables. Run ONCE per already-migrated environment (dev, prod).
//
// Fresh/empty databases must NOT run this — they should run `db:migrate` instead,
// which applies the baseline normally.
const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.DATABASE_AUTH_TOKEN,
});

async function main() {
  const migrations = readMigrationFiles({ migrationsFolder: "./src/db/migrations" });
  if (migrations.length === 0) {
    throw new Error(
      "No migration files found in ./src/db/migrations — run `pnpm db:generate` first.",
    );
  }

  await client.batch(
    [
      "CREATE TABLE IF NOT EXISTS __drizzle_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, hash text NOT NULL, created_at numeric)",
      "DELETE FROM __drizzle_migrations",
      ...migrations.map((m) => ({
        sql: "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
        args: [m.hash, m.folderMillis],
      })),
    ],
    "write",
  );

  console.info(
    `Stamped ${migrations.length} baseline migration(s) as applied. Ledger is now in sync with the current schema.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Re-baseline failed:", err);
    process.exit(1);
  });
