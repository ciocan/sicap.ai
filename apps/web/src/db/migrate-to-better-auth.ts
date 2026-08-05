import { createClient } from "@libsql/client";

import { env } from "@/lib/env";

const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.DATABASE_AUTH_TOKEN,
});

async function main() {
  // Idempotency guard: only run against the old NextAuth schema. If the `account`
  // table has no `providerAccountId` column, the DB is already migrated (or has no
  // NextAuth tables) — abort without changes so a re-run can't corrupt or error mid-way.
  const accountInfo = await client.execute("SELECT name FROM pragma_table_info('account')");
  const hasOldSchema = accountInfo.rows.some((row) => row.name === "providerAccountId");
  if (!hasOldSchema) {
    console.info(
      "`account.providerAccountId` not found — database appears already migrated. Aborting without changes.",
    );
    return;
  }

  const before = await client.batch(
    ["SELECT count(*) AS n FROM user", "SELECT count(*) AS n FROM account"],
    "read",
  );
  console.info("Before:", {
    users: before[0].rows[0]?.n,
    accounts: before[1].rows[0]?.n,
  });

  await client.batch(
    [
      // 1. Rename old NextAuth tables out of the way (names collide with Better Auth).
      "ALTER TABLE `user` RENAME TO `user_old`",
      "ALTER TABLE `account` RENAME TO `account_old`",
      "ALTER TABLE `session` RENAME TO `session_old`",

      // 2. Create Better Auth tables (must match apps/web/src/db/schema.ts).
      `CREATE TABLE \`user\` (
        \`id\` text PRIMARY KEY NOT NULL,
        \`name\` text NOT NULL,
        \`email\` text NOT NULL UNIQUE,
        \`email_verified\` integer DEFAULT 0 NOT NULL,
        \`image\` text,
        \`created_at\` integer NOT NULL,
        \`updated_at\` integer NOT NULL
      )`,
      `CREATE TABLE \`session\` (
        \`id\` text PRIMARY KEY NOT NULL,
        \`expires_at\` integer NOT NULL,
        \`token\` text NOT NULL UNIQUE,
        \`created_at\` integer NOT NULL,
        \`updated_at\` integer NOT NULL,
        \`ip_address\` text,
        \`user_agent\` text,
        \`user_id\` text NOT NULL REFERENCES \`user\`(\`id\`) ON DELETE cascade
      )`,
      `CREATE TABLE \`account\` (
        \`id\` text PRIMARY KEY NOT NULL,
        \`account_id\` text NOT NULL,
        \`provider_id\` text NOT NULL,
        \`user_id\` text NOT NULL REFERENCES \`user\`(\`id\`) ON DELETE cascade,
        \`access_token\` text,
        \`refresh_token\` text,
        \`id_token\` text,
        \`access_token_expires_at\` integer,
        \`refresh_token_expires_at\` integer,
        \`scope\` text,
        \`password\` text,
        \`created_at\` integer NOT NULL,
        \`updated_at\` integer NOT NULL
      )`,
      `CREATE TABLE \`verification\` (
        \`id\` text PRIMARY KEY NOT NULL,
        \`identifier\` text NOT NULL,
        \`value\` text NOT NULL,
        \`expires_at\` integer NOT NULL,
        \`created_at\` integer NOT NULL,
        \`updated_at\` integer NOT NULL
      )`,
      "CREATE INDEX `session__user_id__idx` ON `session` (`user_id`)",
      "CREATE INDEX `account__user_id__idx` ON `account` (`user_id`)",
      "CREATE INDEX `verification__identifier__idx` ON `verification` (`identifier`)",

      // 3. Copy users (name NOT NULL -> COALESCE; emailVerified ts -> bool; text ISO -> ms).
      `INSERT INTO \`user\` (id, name, email, email_verified, image, created_at, updated_at)
        SELECT
          id,
          COALESCE(name, email),
          email,
          CASE WHEN emailVerified IS NOT NULL THEN 1 ELSE 0 END,
          image,
          COALESCE(unixepoch(created_at) * 1000, unixepoch() * 1000),
          COALESCE(unixepoch(updated_at) * 1000, unixepoch() * 1000)
        FROM \`user_old\``,

      // 4. Copy Google account links (providerAccountId -> account_id; provider -> provider_id).
      `INSERT INTO \`account\` (id, account_id, provider_id, user_id, access_token, refresh_token, id_token, access_token_expires_at, scope, created_at, updated_at)
        SELECT
          lower(hex(randomblob(16))),
          providerAccountId,
          provider,
          userId,
          access_token,
          refresh_token,
          id_token,
          CASE WHEN expires_at IS NOT NULL THEN expires_at * 1000 ELSE NULL END,
          scope,
          unixepoch() * 1000,
          unixepoch() * 1000
        FROM \`account_old\``,

      // 5. Drop old tables.
      "DROP TABLE `account_old`",
      "DROP TABLE `session_old`",
      "DROP TABLE `user_old`",
      "DROP TABLE IF EXISTS `verificationToken`",
      "DROP TABLE IF EXISTS `authenticator`",
    ],
    "write",
  );

  const after = await client.batch(
    ["SELECT count(*) AS n FROM user", "SELECT count(*) AS n FROM account"],
    "read",
  );
  console.info("After:", {
    users: after[0].rows[0]?.n,
    accounts: after[1].rows[0]?.n,
  });
  console.info("Migration complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
