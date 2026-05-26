# Migrate from NextAuth v5 to Better Auth — Design

- **Date:** 2026-05-26
- **Status:** Approved (design), pending implementation plan
- **Scope:** `apps/web` auth layer; one-time Turso data migration

## 1. Context & Motivation

`apps/web` authenticates users via **NextAuth.js v5 (`5.0.0-beta.25`)** with the Drizzle adapter on Turso/libSQL, Google OAuth only, and a **stateless JWT** session strategy. We are migrating to the latest **Better Auth (`v1.6.x`)** for a more idiomatic, actively-maintained, plugin-extensible auth layer with first-class database sessions.

### Current-state inventory (what the migration touches)

| Area | File | Notes |
|------|------|-------|
| Auth config | `apps/web/src/lib/auth.ts` | Drizzle adapter, JWT strategy, Google provider, `events` (createUser/signIn/signOut), `callbacks` (session/jwt), module augmentation |
| Route handler | `apps/web/src/app/api/auth/[...nextauth]/route.ts` | Exports `handlers` GET/POST |
| Schema | `apps/web/src/db/schema.ts` | `users`, `accounts`, `sessions`, `verificationTokens`, `authenticators` |
| Sign-in/out UI | `apps/web/src/components/auth.tsx` | `signIn("google")`, `signOut()` |
| Menu sign-out | `apps/web/src/components/menu.tsx` | `signOut()` + Formbricks logout |
| Client session | `apps/web/src/hooks/use-identify.ts`, `apps/web/src/components/csv-download.tsx` | `useSession()` |
| Provider | `apps/web/src/app/(main)/layout.tsx` | `<SessionProvider>` wraps app |
| Server session | `apps/web/src/app/(main)/autentificare/page.tsx`, `apps/web/src/app/(main)/cauta/page.tsx`, `apps/web/src/app/api/search/route.ts` | `await auth()`, reads `session.user.id` |
| Env | `apps/web/src/lib/env.ts` | `GOOGLE_ID`, `GOOGLE_SECRET`, `AUTH_SECRET`, `NEXTAUTH_URL` |
| Integrations | `auth.ts` createUser event | Listmonk subscriber + welcome email |

**Resolved by inspection (no longer open questions):**
- `session.accessToken` is **vestigial** — set in the jwt/session callbacks but never consumed in app code. **Drop it.**
- `authenticators` (WebAuthn/passkeys) table is **defined but unused**. **Drop it.**
- `verificationTokens` is only referenced by the NextAuth adapter config, not app logic (Google OAuth doesn't use it). Replaced by Better Auth `verification`.
- `packages/data/dist/auth/*` contains orphaned, **git-ignored** Better Auth build artifacts with no source and no wiring. **Ignore** — not authoritative; design fresh from official docs.
- App only consumes `session.user.id` and `session.user` presence.

## 2. Goals / Non-Goals

**Goals**
- Replace NextAuth with Better Auth, Google OAuth only, behavior-equivalent.
- **Database-backed sessions + cookie cache** (~5 min) as the session model.
- **Preserve existing users and their Google account links** via a one-time data migration.
- Preserve the Listmonk on-user-creation side effects.

**Non-Goals (YAGNI)**
- No email/password, magic link, or passkey support.
- No new login/error UI — reuse existing `/autentificare` and `/eroare`.
- No middleware-based route protection (none exists today).

## 3. Decisions

1. **Data:** Migrate existing data (preserve users + Google links).
2. **Sessions:** Database sessions + cookie cache (Better Auth default).
3. **Schema strategy:** Adopt Better Auth's **native canonical schema** (`user`/`session`/`account`/`verification`) rather than remapping onto the old plural tables — the `account` table differs structurally (NextAuth composite PK `(provider, providerAccountId)` vs Better Auth `id` PK + `accountId`/`providerId`), so field-mapping alone can't bridge it.
4. **Sign-out logging:** The old `signOut` event only emitted an info log. Better Auth has no direct sign-out DB hook; this low-value log is **dropped**. (`createUser`→Listmonk and `signIn` logging are preserved via database hooks.)
5. **Cutover:** All users are logged out once (cookie/secret/session-format change). Accepted.

## 4. Detailed Design

### 4.1 Schema (`apps/web/src/db/schema.ts`)

Replace the five NextAuth auth tables with Better Auth's four (SQLite/libSQL, Drizzle). Drizzle property keys MUST match Better Auth field names (camelCase); SQL column names are free (snake_case below).

```ts
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
```

> Verify exact column expectations against `npx @better-auth/cli@latest generate` output during implementation; treat the CLI as source of truth and reconcile.

### 4.2 One-time data migration (Turso)

A hand-written SQL migration runs the create → copy → drop sequence so existing rows survive (Drizzle's auto-diff would drop/recreate and lose data). `session` and `verification` start empty (users re-auth).

**User mapping** (`users` → `user`):
- `emailVerified` (timestamp) → boolean: `CASE WHEN emailVerified IS NOT NULL THEN 1 ELSE 0 END` (Google users are verified anyway).
- `createdAt`/`updatedAt` (TEXT) → ms int: `COALESCE(unixepoch(createdAt) * 1000, unixepoch() * 1000)`. **Verify the stored text format** (ISO vs epoch) before finalizing the expression.
- `id`, `name`, `email`, `image` carried over directly.

**Account mapping** (`accounts` → `account`):
- `id` ← `lower(hex(randomblob(16)))` (new surrogate key).
- `accountId` ← `providerAccountId`; `providerId` ← `provider` (`"google"`).
- `accessToken`←`access_token`, `refreshToken`←`refresh_token`, `idToken`←`id_token`, `scope`←`scope`.
- `accessTokenExpiresAt` ← `expires_at * 1000` (seconds→ms) when present.
- `createdAt`/`updatedAt` ← `unixepoch() * 1000`.

Because `accountId` preserves the Google `sub`, Better Auth re-links returning users to their migrated `user` row on first login (lookup by `providerId`+`accountId`) — **no duplicate accounts**.

Finally `DROP TABLE` the old `accounts`, `sessions`, `users`, `verificationToken`, `authenticator`. Run wrapped in a transaction; rehearse against a DB copy first.

### 4.3 Server auth (`apps/web/src/lib/auth.ts`)

```ts
export const auth = betterAuth({
  baseURL: env.NEXTAUTH_URL,            // reuse existing value
  secret: env.AUTH_SECRET,              // reuse existing value
  database: drizzleAdapter(db, { provider: "sqlite", schema: { user, session, account, verification } }),
  socialProviders: {
    google: { clientId: env.GOOGLE_ID, clientSecret: env.GOOGLE_SECRET },
  },
  session: { cookieCache: { enabled: true, maxAge: 300 } },
  databaseHooks: {
    user: { create: { after: async (user) => { /* Listmonk subscriber + welcome email (ported from old createUser event) */ } } },
    session: { create: { after: async (s) => { log.info("User signed in", { userId: s.userId }); } } },
  },
  plugins: [nextCookies()], // MUST be last
});
```

- `nextCookies()` enables cookie setting from server actions/handlers.
- Drop the `next-auth`/`next-auth/jwt` module augmentation; export Better Auth's inferred `Session` type instead.

### 4.4 Client (`apps/web/src/lib/auth-client.ts`, new)

```ts
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient(); // same-origin; no baseURL needed
export const { useSession, signIn, signOut } = authClient;
export type Session = typeof authClient.$Infer.Session;
```

### 4.5 Route handler

Rename `app/api/auth/[...nextauth]/` → `app/api/auth/[...all]/route.ts`:

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
export const { GET, POST } = toNextJsHandler(auth);
```

### 4.6 Call-site changes

| File | Change |
|------|--------|
| `app/(main)/layout.tsx` | Remove `<SessionProvider>` import + wrapper (Better Auth client needs no provider) |
| `components/auth.tsx` | `signIn("google")` → `authClient.signIn.social({ provider: "google", callbackURL: "/", errorCallbackURL: "/eroare" })`; `signOut()` → `authClient.signOut()` |
| `components/menu.tsx` | `signOut()` → `authClient.signOut()`; keep Formbricks logout |
| `hooks/use-identify.ts` | `useSession()` from `@/lib/auth-client`; read `data.user.id` |
| `components/csv-download.tsx` | `useSession()` from client; replace `status === "authenticated"` with `!!session?.user` (+ `isPending`) |
| `app/(main)/autentificare/page.tsx` | `await auth()` → `await auth.api.getSession({ headers: await headers() })`; `if (session?.user) redirect("/")` |
| `app/(main)/cauta/page.tsx` | same getSession swap; `if (!session?.user && …)` |
| `app/api/search/route.ts` | same getSession swap; `const userId = session?.user?.id` |

### 4.7 Env & dependencies

- **Env:** No new required vars (we pass `baseURL`/`secret`/Google creds explicitly from existing env). Optionally set `BETTER_AUTH_URL`/`BETTER_AUTH_SECRET` to the same values for CLI/tooling convenience.
- **Remove:** `next-auth`, `@auth/core`, `@auth/drizzle-adapter`.
- **Add:** `better-auth` (latest, `^1.6`).

## 5. Testing Plan

- `pnpm typecheck`, `pnpm lint`, `pnpm fmt`.
- Migration rehearsal on a **copy** of the Turso DB; verify row counts and a sample user/account mapping.
- Manual (dev server, real browser):
  - New user → Google sign-in → `user` row created, Listmonk hook fires, redirect to `/`.
  - **Migrated existing user** → Google sign-in → re-links to existing `user` (no duplicate), session created.
  - Server session reads: `/cauta` gating, `/autentificare` redirect-when-authed, `/api/search` `userId`.
  - Client session: menu shows authed state, CSV download gate, telemetry identify.
  - Sign-out from menu clears session; Formbricks logout still runs.

## 6. Rollback

Pre-migration DB snapshot/branch. Rollback = restore snapshot + revert the code change (old NextAuth tables and config return together). Keep the migration in a single revertible commit/PR.

## 7. Open Items (resolve during implementation)

- Confirm stored `createdAt`/`updatedAt` text format to finalize the `unixepoch()` conversion.
- Reconcile schema against `@better-auth/cli generate` output (column names/types).
- Confirm Listmonk porting keeps identical request shape/log lines.
