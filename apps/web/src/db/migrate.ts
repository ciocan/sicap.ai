import { migrate } from "drizzle-orm/libsql/migrator";

import { db } from "./schema";
import { env } from "@/lib/env";

console.info("Migrating database...");
console.info(env.DATABASE_URL);

migrate(db, { migrationsFolder: "./src/db/migrations" });
migrate(db, { migrationsFolder: "./src/db/migrations" })
  .then(() => {
    console.info("Migrations completed!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migrations failed!", err);
    process.exit(1);
  });
