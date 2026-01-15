import { migrate } from "drizzle-orm/libsql/migrator";

import { db } from "./schema";

migrate(db, { migrationsFolder: "./src/db/migrations" });
migrate(db, { migrationsFolder: "./src/db/migrations" })
  .then(() => {
    process.exit(0);
  })
  .catch((_err) => {
    process.exit(1);
  });
