# Better Auth Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace NextAuth v5 with Better Auth v1.6 in `apps/web` (Google OAuth, database sessions + cookie cache), preserving existing users and their Google account links.

**Architecture:** A single `betterAuth()` server instance backed by the existing Turso/libSQL Drizzle database; native Better Auth schema (`user`/`session`/`account`/`verification`); a React client (`better-auth/react`) replacing `next-auth/react`; a one-time atomic SQL data migration that renames the old NextAuth tables, creates the Better Auth tables, copies data, and drops the old tables.

**Tech Stack:** Next.js 16 (App Router, RSC), Better Auth `^1.6`, Drizzle ORM, Turso/libSQL, Biome, pnpm + Turbo.

---

## Constraints & Conventions (read first)

- **DO NOT run `git commit`.** The user reviews the full diff and commits at the end (see final task). Make edits and run verification only.
- **No automated test harness exists** in this repo (no `test` script, no vitest/jest). Per the approved spec, verification is: `pnpm typecheck`, `pnpm lint`, `pnpm fmt`, a migration rehearsal on a DB copy, and manual browser flows. Do **not** scaffold a test framework — that is out of scope.
- **Intermediate states will not typecheck.** This is a cross-cutting swap; several files reference `next-auth` until all are updated. Run the full `pnpm typecheck` only at Task 10, not after every edit.
- Romanian for UI text, English for code. Biome formats (100-char width). `"use client"` only on interactive components.
- Run all commands from the repo root `/Users/ciocan/projects/sicap.ai` unless stated.

## Critical facts discovered (do not re-derive)

- **Old table names are singular and collide with Better Auth's:** old `user`, `account`, `session`, `verificationToken`, `authenticator`. New: `user`, `session`, `account`, `verification`. → migration must rename old tables before creating new ones.
- Old `users.created_at` / `users.updated_at` are **TEXT ISO strings** (set via `new Date().toISOString()`), so `unixepoch(col)*1000` converts them to Better Auth's `timestamp_ms`.
- Old `users.name` is **nullable**; Better Auth `user.name` is `NOT NULL` → `COALESCE(name, email)` in the copy.
- Old `accounts` columns: `userId`, `provider`, `providerAccountId`, `access_token`, `refresh_token`, `id_token`, `expires_at` (seconds), `scope`, `type`, `token_type`, `session_state`.
- `session.accessToken` is vestigial (never consumed) → dropped. `authenticators` table is unused → dropped.
- `db` (the Drizzle client) is exported from `apps/web/src/db/schema.ts`.
- `useIdentify` (`apps/web/src/hooks/use-identify.ts`) is consumed by `menu.tsx`, `navbar.tsx`, `formbricks.tsx` and exposes `{ isAuthenticated, isLoading, user, userId, status }` — preserve this exact shape.
- Drizzle config: `apps/web/drizzle.config.ts` (`dialect: "turso"`, `out: ./src/db/migrations`). Migrations applied via `apps/web/src/db/migrate.ts` (drizzle libsql migrator). The data migration in this plan is a **standalone script**, intentionally outside the drizzle-kit generate flow (see Task 3 note).

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/web/package.json` | Modify | Swap deps: add `better-auth`, remove `next-auth`/`@auth/core`/`@auth/drizzle-adapter` |
| `apps/web/src/db/schema.ts` | Modify | Replace 5 NextAuth tables with 4 Better Auth tables (keep `db` export) |
| `apps/web/src/db/migrate-to-better-auth.ts` | Create | One-time atomic data migration runner (libSQL batch) |
| `apps/web/src/lib/auth.ts` | Rewrite | `betterAuth()` instance: Drizzle adapter, Google, cookie cache, `nextCookies`, database hooks (Listmonk + sign-in) |
| `apps/web/src/lib/auth-client.ts` | Create | `createAuthClient` (`better-auth/react`); export `useSession`/`signIn`/`signOut`/`Session` |
| `apps/web/src/app/api/auth/[...all]/route.ts` | Create | `toNextJsHandler(auth)` |
| `apps/web/src/app/api/auth/[...nextauth]/route.ts` | Delete | Replaced by `[...all]` |
| `apps/web/src/app/(main)/autentificare/page.tsx` | Modify | `auth()` → `auth.api.getSession` |
| `apps/web/src/app/(main)/cauta/page.tsx` | Modify | `auth()` → `auth.api.getSession` |
| `apps/web/src/app/api/search/route.ts` | Modify | `auth()` → `auth.api.getSession` (uses `request.headers`) |
| `apps/web/src/components/auth.tsx` | Modify | `signIn`/`signOut` → auth-client (`signIn.social`) |
| `apps/web/src/components/menu.tsx` | Modify | `signOut` import → auth-client |
| `apps/web/src/hooks/use-identify.ts` | Modify | `useSession` → auth-client; synthesize `status` |
| `apps/web/src/components/csv-download.tsx` | Modify | `useSession` → auth-client |
| `apps/web/src/app/(main)/layout.tsx` | Modify | Remove `<SessionProvider>` |

---

## Task 1: Swap dependencies

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Add Better Auth, remove NextAuth packages**

Run:
```bash
pnpm --filter @sicap/web add better-auth
pnpm --filter @sicap/web remove next-auth @auth/core @auth/drizzle-adapter
```

- [ ] **Step 2: Confirm the dependency change**

Run:
```bash
grep -E '"(better-auth|next-auth|@auth/core|@auth/drizzle-adapter)"' apps/web/package.json
```
Expected: a line for `better-auth` only; the three `next-auth`/`@auth/*` lines are gone.

- [ ] **Step 3: Confirm `@auth/core` had no other consumers**

Run:
```bash
grep -rn "@auth/core\|next-auth" apps/web/src --include="*.ts" --include="*.tsx"
```
Expected (now): matches only in files this plan rewrites later (`lib/auth.ts`, `db/schema.ts`, `components/auth.tsx`, `components/menu.tsx`, `hooks/use-identify.ts`, `components/csv-download.tsx`, `app/(main)/layout.tsx`). No other files. (These are fixed in later tasks.)

---

## Task 2: Replace the database schema

**Files:**
- Modify: `apps/web/src/db/schema.ts`

- [ ] **Step 1: Rewrite the schema with Better Auth tables**

Replace the entire contents of `apps/web/src/db/schema.ts` with:

```ts
import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { drizzle } from "drizzle-orm/libsql";

import { env } from "@/lib/env";

export const db = drizzle({
  connection: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
});

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => ({
    userIdIndex: index("session__user_id__idx").on(t.userId),
  }),
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({
    userIdIndex: index("account__user_id__idx").on(t.userId),
  }),
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({
    identifierIndex: index("verification__identifier__idx").on(t.identifier),
  }),
);
```

- [ ] **Step 2: Cross-check column names against the Better Auth CLI**

Run:
```bash
cd apps/web && pnpm dlx @better-auth/cli@latest generate --output ./tmp-betterauth-schema.ts || true; cd ..
```
Open `apps/web/tmp-betterauth-schema.ts` (if generated) and compare field names/types against Step 1. The Drizzle adapter maps by the **camelCase property keys** (`emailVerified`, `accessToken`, etc.) — those must match Better Auth's expectations; SQL column strings (snake_case) are free. Reconcile any differences into Step 1, then delete the temp file:
```bash
rm -f apps/web/tmp-betterauth-schema.ts
```
(If the CLI cannot run offline/without config, skip — Step 1 mirrors the documented v1.6 SQLite schema. Note for the reviewer that the CLI cross-check was skipped.)

---

## Task 3: One-time data migration (rename → create → copy → drop)

**Files:**
- Create: `apps/web/src/db/migrate-to-better-auth.ts`
- Modify: `apps/web/package.json` (add a script)

> **Why a standalone script (not a drizzle-kit migration):** the old/new table names collide, so the migration needs `ALTER TABLE … RENAME`, which `drizzle-kit generate` will not emit (it would `DROP`+`CREATE`, destroying data). This script runs the whole sequence atomically via a single libSQL write-batch. It lives outside the drizzle-kit snapshot flow; see the re-baseline note at the end of this task before the next time anyone runs `pnpm db:generate`.

- [ ] **Step 1: Create the migration runner**

Create `apps/web/src/db/migrate-to-better-auth.ts`:

```ts
import { createClient } from "@libsql/client";

import { env } from "@/lib/env";

const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.DATABASE_AUTH_TOKEN,
});

async function main() {
  const before = await client.batch(
    [
      "SELECT count(*) AS n FROM user",
      "SELECT count(*) AS n FROM account",
    ],
    "read",
  );
  console.log("Before:", {
    users: before[0].rows[0]?.n,
    accounts: before[1].rows[0]?.n,
  });

  await client.batch(
    [
      "PRAGMA foreign_keys=OFF",

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

      "PRAGMA foreign_keys=ON",
    ],
    "write",
  );

  const after = await client.batch(
    [
      "SELECT count(*) AS n FROM user",
      "SELECT count(*) AS n FROM account",
    ],
    "read",
  );
  console.log("After:", {
    users: after[0].rows[0]?.n,
    accounts: after[1].rows[0]?.n,
  });
  console.log("Migration complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
```

- [ ] **Step 2: Add a script to run it**

In `apps/web/package.json`, add to `"scripts"` (after the `db:migrate` line):
```json
    "db:migrate:betterauth": "tsx ./src/db/migrate-to-better-auth.ts",
```

- [ ] **Step 3: Rehearse on a copy of the database (NOT prod)**

Do not run against production yet. Use the local dev DB (`pnpm db:dev` provides a `turso dev` server) or a dump/replica. Point `.env`'s `DATABASE_URL`/`DATABASE_AUTH_TOKEN` at the copy, then:
```bash
pnpm with-env pnpm --filter @sicap/web db:migrate:betterauth
```
Expected: prints `Before: { users: N, accounts: M }` then `After: { users: N, accounts: M }` with **equal** counts, then `Migration complete.`

- [ ] **Step 4: Spot-check a migrated row**

Run (against the same copy):
```bash
pnpm with-env pnpm --filter @sicap/web exec tsx -e "import {createClient} from '@libsql/client'; const c=createClient({url:process.env.DATABASE_URL!,authToken:process.env.DATABASE_AUTH_TOKEN}); const u=await c.batch(['SELECT id,name,email,email_verified,created_at FROM user LIMIT 3','SELECT id,account_id,provider_id,user_id FROM account LIMIT 3'],'read'); console.log(JSON.stringify(u.map(r=>r.rows),null,2));"
```
Expected: `email_verified` is `0`/`1`, `created_at` is a 13-digit ms integer, every `account.provider_id` is `"google"`, and `account.account_id` matches the Google `sub` from the old data. Each `account.user_id` exists in `user`.

> **Re-baseline note (do once, after the migration is accepted):** because this ran outside drizzle-kit, the next `pnpm db:generate` would diff `schema.ts` against the stale `0001` snapshot and try to recreate tables. Before running `db:generate` again, re-baseline: archive/remove `apps/web/src/db/migrations/0000_*.sql`, `0001_*.sql` and `meta/`, run `pnpm db:generate` to emit a fresh `0000` baseline reflecting the Better Auth schema, and record the baseline as applied in the `__drizzle_migrations` table on each environment. This is a follow-up; flag it for the reviewer rather than doing it inline.

---

## Task 4: Rewrite the server auth instance

**Files:**
- Rewrite: `apps/web/src/lib/auth.ts`

- [ ] **Step 1: Replace the file contents**

Replace the entire contents of `apps/web/src/lib/auth.ts` with:

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { Logger } from "next-axiom";

import { account, db, session, user, verification } from "../db/schema";
import { addSubscriber, addSubscriberToLists, messageSubscriber } from "./listmonk";
import { env } from "./env";

const log = new Logger();

export const auth = betterAuth({
  baseURL: env.NEXTAUTH_URL,
  secret: env.AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { user, session, account, verification },
  }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_ID ?? "",
      clientSecret: env.GOOGLE_SECRET ?? "",
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 300,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          const { id, email, name } = createdUser;
          log.info("User created", { userId: id });
          try {
            await addSubscriber({ email, name: name ?? email, attribs: { userId: id } });
            await addSubscriberToLists({ email, lists: ["users"] });
            await messageSubscriber({ email, template: "welcome" });
          } catch (_e) {}
        },
      },
    },
    session: {
      create: {
        after: async (createdSession) => {
          const { userId } = createdSession;
          log.info("User signed in", { userId });
          await db.update(user).set({ updatedAt: new Date() }).where(eq(user.id, userId));
        },
      },
    },
  },
  plugins: [nextCookies()],
});
```

- [ ] **Step 2: Verify import paths exist in the installed package**

Run:
```bash
node -e "require.resolve('better-auth'); require.resolve('better-auth/adapters/drizzle'); require.resolve('better-auth/next-js'); require.resolve('better-auth/react'); console.log('ok')" 2>/dev/null && echo OK || echo "CHECK EXPORTS"
```
Expected: `OK`. If `CHECK EXPORTS`, run `cat node_modules/better-auth/package.json | grep -A40 '"exports"'` and adjust import specifiers to the actual subpath exports for the installed version (note any change for the reviewer).

---

## Task 5: Create the client

**Files:**
- Create: `apps/web/src/lib/auth-client.ts`

- [ ] **Step 1: Create the auth client**

Create `apps/web/src/lib/auth-client.ts`:

```ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { useSession, signIn, signOut } = authClient;

export type Session = typeof authClient.$Infer.Session;
```

---

## Task 6: Move the route handler

**Files:**
- Create: `apps/web/src/app/api/auth/[...all]/route.ts`
- Delete: `apps/web/src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create the new catch-all handler**

Create `apps/web/src/app/api/auth/[...all]/route.ts`:

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 2: Delete the old NextAuth route**

Run:
```bash
rm apps/web/src/app/api/auth/[...nextauth]/route.ts && rmdir "apps/web/src/app/api/auth/[...nextauth]" 2>/dev/null; ls apps/web/src/app/api/auth
```
Expected: lists `[...all]` and not `[...nextauth]`.

---

## Task 7: Update server-side session reads

**Files:**
- Modify: `apps/web/src/app/(main)/autentificare/page.tsx`
- Modify: `apps/web/src/app/(main)/cauta/page.tsx`
- Modify: `apps/web/src/app/api/search/route.ts`

- [ ] **Step 1: `autentificare/page.tsx`**

Change the imports near the top (currently `import { auth } from "@/lib/auth";`) to also import `headers`, and replace the session read.

Add this import (with the other imports):
```ts
import { headers } from "next/headers";
```
Replace:
```ts
  const session = await auth().catch(() => null);
```
with:
```ts
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
```
(The `if (session?.user) { redirect("/"); }` below is unchanged.)

- [ ] **Step 2: `cauta/page.tsx`**

Add the import:
```ts
import { headers } from "next/headers";
```
Replace:
```ts
  const session = await auth().catch(() => null);
```
with:
```ts
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
```
(The `if (!session?.user && !checkSearchTerms(await searchParams))` below is unchanged.)

- [ ] **Step 3: `api/search/route.ts`**

This handler already has `request`, so read headers from it (no `next/headers` import needed). Replace:
```ts
  const session = await auth().catch(() => null);
  const userId = session?.user?.id;
```
with:
```ts
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
  const userId = session?.user?.id;
```

---

## Task 8: Update client-side auth usage

**Files:**
- Modify: `apps/web/src/components/auth.tsx`
- Modify: `apps/web/src/components/menu.tsx`
- Modify: `apps/web/src/hooks/use-identify.ts`
- Modify: `apps/web/src/components/csv-download.tsx`

- [ ] **Step 1: `components/auth.tsx`**

Replace the import:
```ts
import { signIn, signOut } from "next-auth/react";
```
with:
```ts
import { signIn, signOut } from "@/lib/auth-client";
```
Replace the `handleSignIn` body:
```ts
  const handleSignIn = () => {
    captureGoogleSignInButtonClick();
    signIn("google");
  };
```
with:
```ts
  const handleSignIn = () => {
    captureGoogleSignInButtonClick();
    signIn.social({ provider: "google", callbackURL: "/", errorCallbackURL: "/eroare" });
  };
```
(The `SignOut` component's `onClick={() => signOut()}` works unchanged with the new `signOut`.)

- [ ] **Step 2: `components/menu.tsx`**

Replace the import:
```ts
import { signOut } from "next-auth/react";
```
with:
```ts
import { signOut } from "@/lib/auth-client";
```
(`handleSignout` calls `signOut()` then Formbricks reset/logout — unchanged.)

- [ ] **Step 3: `hooks/use-identify.ts`**

Replace the entire file contents with (preserves the `{ isAuthenticated, isLoading, user, userId, status }` contract its consumers rely on):

```ts
import { useEffect } from "react";

import { useSession } from "@/lib/auth-client";
import { identifyUser } from "@/lib/telemetry";

export function useIdentify() {
  const { data, isPending } = useSession();
  const user = data?.user;
  const userId = user?.id;
  const isAuthenticated = !!user;
  const isLoading = isPending;
  const status = isPending ? "loading" : isAuthenticated ? "authenticated" : "unauthenticated";

  useEffect(() => {
    if (isAuthenticated && userId) {
      identifyUser(userId, user);
    }
  }, [isAuthenticated, userId, user]);

  return { isAuthenticated, isLoading, user, userId, status };
}
```

> If `pnpm typecheck` (Task 10) flags the `identifyUser(userId, user)` call because the Better Auth user shape differs from the old NextAuth user, widen `identifyUser`'s param type at its definition in `apps/web/src/lib/telemetry.ts` to accept the Better Auth user (it has `id`, `name`, `email`, `image`, `emailVerified`, `createdAt`, `updatedAt`). Do not change call behavior.

- [ ] **Step 4: `components/csv-download.tsx`**

Replace the import:
```ts
import { useSession } from "next-auth/react";
```
with:
```ts
import { useSession } from "@/lib/auth-client";
```
Replace:
```ts
  const session = useSession();
  const router = useRouter();
  const isAuthenticated = session.status === "authenticated";
```
with:
```ts
  const { data } = useSession();
  const router = useRouter();
  const isAuthenticated = !!data?.user;
```

---

## Task 9: Remove the NextAuth SessionProvider

**Files:**
- Modify: `apps/web/src/app/(main)/layout.tsx`

- [ ] **Step 1: Delete the import**

Remove this line:
```ts
import { SessionProvider } from "next-auth/react";
```

- [ ] **Step 2: Unwrap the provider**

Replace:
```tsx
        <Suspense fallback={null}>
          <SessionProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Suspense fallback={null}>
                <FormbricksProvider>
                  <div className="relative flex min-h-screen flex-col">
                    <Navbar />
                    <div className="flex flex-col flex-1">{children}</div>
                    <Footer />
                  </div>
                </FormbricksProvider>
              </Suspense>
            </ThemeProvider>
          </SessionProvider>
        </Suspense>
```
with:
```tsx
        <Suspense fallback={null}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Suspense fallback={null}>
              <FormbricksProvider>
                <div className="relative flex min-h-screen flex-col">
                  <Navbar />
                  <div className="flex flex-col flex-1">{children}</div>
                  <Footer />
                </div>
              </Suspense>
            </ThemeProvider>
        </Suspense>
```
(Better Auth's `useSession` reads from a nanostore — no React provider is required.)

---

## Task 10: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run:
```bash
pnpm typecheck
```
Expected: passes. Resolve any residual `next-auth` references it surfaces (there should be none) and the `identifyUser` shape note from Task 8 Step 3 if it appears.

- [ ] **Step 2: Lint and format**

Run:
```bash
pnpm lint
pnpm fmt
```
Expected: lint clean; `fmt` rewrites files to Biome style (review the formatting diff).

- [ ] **Step 3: Confirm `next-auth` is fully gone from source**

Run:
```bash
grep -rn "next-auth\|@auth/" apps/web/src --include="*.ts" --include="*.tsx"
```
Expected: no matches.

- [ ] **Step 4: Manual browser verification (dev)**

Ensure `.env` points at the **migrated dev DB** and that `NEXTAUTH_URL` matches the dev origin **including port 3042** (`http://localhost:3042`); Better Auth uses `baseURL` to build the Google callback (`{baseURL}/api/auth/callback/google`), which must also be registered in the Google console for the dev client. Start the server:
```bash
pnpm dev
```
Then in a browser at `http://localhost:3042`, verify each:
- **New user:** sign in with a Google account that has no existing row → lands on `/`; a `user` row is created; Listmonk subscriber + welcome email fire (check logs/Listmonk); menu shows the name/avatar.
- **Migrated existing user:** sign in with a Google account that existed pre-migration → links to the existing `user` (no duplicate row — verify `SELECT count(*) FROM user` did not grow by 2); session works.
- **Server gating:** visiting `/autentificare` while signed in redirects to `/`; `/cauta` without a query while signed out redirects to `/autentificare`; a search POST records `userId` (check `saveSearch`).
- **Client state:** `Menu` shows authed UI; `CSVDownload` on a `/firma/[nationalId]` page downloads when signed in and redirects to `/autentificare` when signed out.
- **Sign out:** from the menu → session cleared, Formbricks reset/logout still runs, UI returns to signed-out.

- [ ] **Step 5: Record results**

Note any deviations (especially the Google callback URL registration and the `identifyUser` type widening) for the review handoff.

---

## Task 11: Review handoff (no commit by the agent)

**Files:** none

- [ ] **Step 1: Summarize the change set**

Run:
```bash
git status --short
git diff --stat
```

- [ ] **Step 2: Present for review**

Do **not** commit. Summarize for the user: files changed, the dependency swap, the migration script + rehearsal results, manual-test outcomes, and the two follow-ups (drizzle re-baseline note in Task 3; Google dev/prod callback URL registration). The user reviews the diff and commits.

---

## Self-Review (performed against the spec)

- **Spec coverage:** schema replacement (Task 2 ↔ spec §4.1); data migration with documented transforms (Task 3 ↔ §4.2); server config incl. cookie cache, `nextCookies`, Listmonk + sign-in hooks (Task 4 ↔ §4.3, §3.4); client (Task 5 ↔ §4.4); route handler rename (Task 6 ↔ §4.5); all seven call-sites + SessionProvider removal + dropped `accessToken` (Tasks 7–9 ↔ §4.6); env/deps (Tasks 1,4 ↔ §4.7); cutover re-login is inherent (new cookie/secret); testing (Task 10 ↔ §5); rollback via the reviewer's pre-migration snapshot + single revertible PR (§6). Open items from §7 are wired in as Task 2 Step 2 (CLI cross-check), Task 3 Step 4 (timestamp format spot-check), and Task 4 Step 2 (export paths).
- **Placeholder scan:** none — every code/edit step contains literal content and exact commands.
- **Type consistency:** schema exports `user`/`session`/`account`/`verification` (singular) and `db`; `auth.ts`, `auth-client.ts`, and all call-sites use those exact names; `auth.api.getSession` returns `{ user, session }` so `session?.user(.id)` reads hold across Tasks 7; `useIdentify` return shape preserved for `menu`/`navbar`/`formbricks`.
