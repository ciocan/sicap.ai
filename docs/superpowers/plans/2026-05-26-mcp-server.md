# MCP Server for Authenticated Users — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose SICAP.ai's procurement search as an OAuth-authenticated remote MCP server inside the existing Next.js app, so users can query it from Claude and other agents.

**Architecture:** Better Auth's `mcp` plugin turns the app into an OAuth 2.0 provider (Dynamic Client Registration + consent). A single route at `app/api/[transport]/route.ts` uses `withMcpAuth` + `@vercel/mcp-adapter` to serve 6 read-only tools that wrap existing `@sicap/api` Elasticsearch functions. Per-user rate limiting (Turso) and per-call Axiom telemetry wrap each tool. Self-hosted Docker → stateless Streamable HTTP, no Redis.

**Tech Stack:** Next.js 16, Better Auth 1.6.11 (`mcp`/`withMcpAuth`/`oAuthDiscoveryMetadata`/`oAuthProtectedResourceMetadata`), `@vercel/mcp-adapter`, Drizzle + Turso, Zod, next-axiom, Vitest (new), BotID (`botid`).

**Design source:** `docs/superpowers/specs/2026-05-26-mcp-server-design.md`

---

## Testing Strategy (read first)

The repo has **no test runner today**, and this feature is mostly OAuth/route/config integration. So:

- **TDD (Vitest red-green)** for the *pure, env-free* logic: the compact-row projection and the pagination clamp. These have real bug surface (wrong fields, off-by-one caps) and test cleanly.
- **Verification (no unit tests)** for OAuth enablement, the migration, the route, rate limiting, consent, and the pages. We verify with: `pnpm typecheck`, the **MCP Inspector** (`npx @modelcontextprotocol/inspector`), a real **Claude Code** connection (`claude mcp add`), browser checks, and observing **Axiom** events. Mocking the OAuth provider or Elasticsearch would produce green tests that prove nothing.

Each task states its verification method explicitly.

## Commit policy

Commits are **phase-level checkpoints**, not per-step. The repo owner reviews each diff before anything is pushed. Never push; never force-push.

## Conventions confirmed from the codebase

- Path alias `@/*` → `apps/web/src/*`. Run all `pnpm` commands from repo root unless noted.
- Scripts: `pnpm --filter web dev` (port 3042), `pnpm typecheck`, `pnpm lint`, `pnpm fmt`, `pnpm db:generate`, `pnpm db:migrate`. (apps/web package name is `web`.)
- Route style: `withAxiom(async (request: AxiomRequest) => …)`; session via `auth.api.getSession({ headers })`.
- Axiom logging: `import { Logger } from "next-axiom"; const log = new Logger(); log.info(msg, obj); await log.flush();`
- BotID is **config-only** (`withBotId` in `next.config.ts`) and enforced **only where code calls `checkBot()`** (`apps/web/src/lib/server.ts`). The MCP route simply must **not** call `checkBot()`. No middleware to edit. ✅ landmine handled by omission.
- Index→type: `searchContracts` returns `items: [{ id, index, fields }]` where `index` is `"public" | "direct" | "offline"`. (Verify in Task 4.)

---

## Task 0: Add dependencies + Vitest

**Files:**
- Modify: `apps/web/package.json` (deps + scripts)
- Create: `apps/web/vitest.config.ts`

- [ ] **Step 1: Add runtime + dev deps**

Run:
```bash
pnpm --filter web add @vercel/mcp-adapter
pnpm --filter web add -D vitest
```
(`zod` and `better-auth` are already present.)

- [ ] **Step 2: Add test scripts**

In `apps/web/package.json` `"scripts"`, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create Vitest config**

`apps/web/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Verify Vitest runs (no tests yet)**

Run: `pnpm --filter web test`
Expected: exits 0 with "No test files found" (or similar). Confirms the runner works.

- [ ] **Step 5: Commit**
```bash
git add apps/web/package.json apps/web/vitest.config.ts pnpm-lock.yaml
git commit -m "chore(web): add @vercel/mcp-adapter and vitest for MCP server"
```

---

## Task 1: Pure projection + pagination logic (TDD)

This is the one genuine red-green task. The module is **env-free** (reads `process.env.BASE_URL` directly with a fallback) so tests need no setup.

**Files:**
- Test: `apps/web/src/lib/mcp/format.test.ts`
- Create: `apps/web/src/lib/mcp/format.ts`

- [ ] **Step 1: Write the failing tests**

`apps/web/src/lib/mcp/format.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { clampPerPage, contractUrl, toCompactRow } from "./format";

describe("clampPerPage", () => {
  it("defaults to 10 when undefined", () => expect(clampPerPage(undefined)).toBe(10));
  it("defaults to 10 when < 1", () => expect(clampPerPage(0)).toBe(10));
  it("passes through a value within range", () => expect(clampPerPage(25)).toBe(25));
  it("caps at 50", () => expect(clampPerPage(500)).toBe(50));
});

describe("contractUrl", () => {
  it("builds a licitatii URL for public", () =>
    expect(contractUrl("public", "abc")).toBe("https://sicap.ai/licitatii/abc"));
  it("builds an achizitii URL for direct", () =>
    expect(contractUrl("direct", "abc")).toBe("https://sicap.ai/achizitii/abc"));
  it("builds an achizitii-offline URL for offline", () =>
    expect(contractUrl("offline", "abc")).toBe("https://sicap.ai/achizitii-offline/abc"));
});

describe("toCompactRow", () => {
  it("projects an ES item to the compact shape", () => {
    const row = toCompactRow({
      id: "id1",
      index: "direct",
      fields: {
        date: "2025-01-01",
        name: "Servicii curatenie",
        code: "C123",
        cpvCode: "90910000",
        cpvCodeAndName: "90910000 - Servicii de curatenie",
        value: "12000",
        supplierId: "s1",
        supplierName: "ACME SRL",
        supplierFiscalNumber: "RO1",
        localitySupplier: "Cluj",
        countySupplier: "CJ",
        contractingAuthorityId: "a1",
        contractingAuthorityName: "Primaria Cluj",
        authorityFiscalNumber: "RO2",
        localityAuthority: "Cluj",
        countyAuthority: "CJ",
        state: "atribuit",
        stateId: 1,
        type: "contract",
        typeId: 1,
        euFunds: "false",
      },
    });
    expect(row).toEqual({
      id: "id1",
      type: "direct",
      object: "90910000 - Servicii de curatenie",
      authority: "Primaria Cluj",
      supplier: "ACME SRL",
      value: "12000",
      date: "2025-01-01",
      cpv: "90910000",
      url: "https://sicap.ai/achizitii/id1",
    });
  });

  it("falls back to name when cpvCodeAndName is empty", () => {
    const row = toCompactRow({
      id: "id2",
      index: "public",
      fields: { cpvCodeAndName: "", name: "Lucrari drum" } as never,
    });
    expect(row.object).toBe("Lucrari drum");
    expect(row.url).toBe("https://sicap.ai/licitatii/id2");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter web test`
Expected: FAIL — `Cannot find module './format'`.

- [ ] **Step 3: Implement the module**

`apps/web/src/lib/mcp/format.ts`:
```ts
import type { IndexName, SearchItemDirect, SearchItemOffline, SearchItemPublic } from "@sicap/api";

export type ContractType = "public" | "direct" | "offline";

type AnyItem = SearchItemPublic | SearchItemDirect | SearchItemOffline;

const BASE_URL = process.env.BASE_URL ?? "https://sicap.ai";

const TYPE_PATH: Record<ContractType, string> = {
  public: "licitatii",
  direct: "achizitii",
  offline: "achizitii-offline",
};

export function clampPerPage(perPage?: number): number {
  if (!perPage || perPage < 1) return 10;
  return Math.min(perPage, 50);
}

export function contractUrl(type: ContractType, id: string): string {
  return `${BASE_URL}/${TYPE_PATH[type]}/${id}`;
}

export interface CompactRow {
  id: string;
  type: ContractType;
  object: string;
  authority: string;
  supplier: string;
  value: string;
  date: string;
  cpv: string;
  url: string;
}

export function toCompactRow(item: { id: string; index: IndexName; fields: AnyItem }): CompactRow {
  const type = item.index as ContractType;
  const f = item.fields;
  return {
    id: item.id,
    type,
    object: f.cpvCodeAndName || f.name,
    authority: f.contractingAuthorityName,
    supplier: f.supplierName,
    value: f.value,
    date: f.date,
    cpv: f.cpvCode,
    url: contractUrl(type, item.id),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter web test`
Expected: PASS (all cases green).

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter web typecheck`
Expected: no errors. (Confirms `IndexName`/`SearchItem*` are exported from `@sicap/api` as assumed.)

- [ ] **Step 6: Commit**
```bash
git add apps/web/src/lib/mcp/format.ts apps/web/src/lib/mcp/format.test.ts
git commit -m "feat(mcp): add compact-row projection and pagination clamp (TDD)"
```

---

## Task 2: Contract-type dispatch helper

Trivial routing over three existing functions; verified by typecheck (mocking the ES functions would test nothing real).

**Files:**
- Create: `apps/web/src/lib/mcp/contracts.ts`

- [ ] **Step 1: Implement**

`apps/web/src/lib/mcp/contracts.ts`:
```ts
import {
  getContractAchizitii,
  getContractAchizitiiOffline,
  getContractLicitatii,
} from "@sicap/api";
import type { ContractType } from "./format";

export function getContractByType(type: ContractType, id: string) {
  switch (type) {
    case "public":
      return getContractLicitatii(id);
    case "direct":
      return getContractAchizitii(id);
    case "offline":
      return getContractAchizitiiOffline(id);
  }
}
```

- [ ] **Step 2: Verify exact export names + typecheck**

Run: `pnpm --filter web typecheck`
Expected: no errors. If a name differs (e.g. `getContractAchizitiiOffline`), open `packages/api/src/index.ts` and the `es/*/get-contract.ts` files, correct the import, re-run.

- [ ] **Step 3: Commit**
```bash
git add apps/web/src/lib/mcp/contracts.ts
git commit -m "feat(mcp): add contract-type dispatch helper"
```

---

## Task 3: Enable the `mcp` plugin + OAuth/rate-limit schema + migration

**Files:**
- Modify: `apps/web/src/lib/auth.ts`
- Modify: `apps/web/src/db/schema.ts`
- Generated: `apps/web/src/db/migrations/*` (drizzle output)

- [ ] **Step 1: Enable the plugin**

In `apps/web/src/lib/auth.ts`, add the import and update the `plugins` array. `nextCookies()` must remain **last**.
```ts
import { mcp } from "better-auth/plugins";
```
```ts
  plugins: [
    mcp({
      loginPage: "/autentificare",
      oidcConfig: {
        consentPage: "/oauth/consent",
      },
    }),
    nextCookies(),
  ],
```

- [ ] **Step 2: Generate the exact OAuth table definitions**

Better Auth's `mcp` plugin requires `oauthApplication`, `oauthAccessToken`, and `oauthConsent`. Get version-exact column definitions from the CLI rather than hand-writing them:

Run (from repo root):
```bash
cd apps/web && npx @better-auth/cli@latest generate --config ./src/lib/auth.ts --output ./src/db/_mcp.generated.ts ; cd ../..
```
Open `apps/web/src/db/_mcp.generated.ts`. It contains `sqliteTable` definitions for `oauthApplication`, `oauthAccessToken`, `oauthConsent` (Better Auth field names — e.g. `clientId`, `clientSecret`, `redirectURLs`, `scopes`, `userId`, timestamps).

- [ ] **Step 3: Merge generated tables + add the rate-limit table into schema.ts**

Copy the three generated `oauthApplication`/`oauthAccessToken`/`oauthConsent` table blocks into `apps/web/src/db/schema.ts` (match the file's existing `sqliteTable` + `integer(..., { mode: "timestamp_ms" })` style; keep FKs to `user.id` where the generator references them). Then delete the scratch file:
```bash
rm apps/web/src/db/_mcp.generated.ts
```
Append the rate-limit table (used by Task 5) to `schema.ts`:
```ts
export const mcpRateLimit = sqliteTable(
  "mcp_rate_limit",
  {
    id: text("id").primaryKey(), // `${userId}:${windowStart}`
    userId: text("user_id").notNull(),
    windowStart: integer("window_start").notNull(), // epoch minute
    count: integer("count").notNull().default(0),
  },
  (t) => ({
    userIdIndex: index("mcp_rate_limit__user_id__idx").on(t.userId),
  }),
);
```

- [ ] **Step 4: Generate + apply the migration**

Run:
```bash
pnpm --filter web db:generate
pnpm --filter web db:migrate
```
Expected: one new SQL file in `apps/web/src/db/migrations/` creating `oauth_application`, `oauth_access_token`, `oauth_consent`, and `mcp_rate_limit`; migrate applies cleanly to the local Turso DB (`pnpm db:dev` running).

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter web typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**
```bash
git add apps/web/src/lib/auth.ts apps/web/src/db/schema.ts apps/web/src/db/migrations
git commit -m "feat(mcp): enable Better Auth mcp plugin + OAuth/rate-limit schema migration"
```

---

## Task 4: OAuth discovery routes

**Files:**
- Create: `apps/web/src/app/.well-known/oauth-authorization-server/route.ts`
- Create: `apps/web/src/app/.well-known/oauth-protected-resource/route.ts`

- [ ] **Step 1: Authorization-server metadata**

`apps/web/src/app/.well-known/oauth-authorization-server/route.ts`:
```ts
import { oAuthDiscoveryMetadata } from "better-auth/plugins";
import { auth } from "@/lib/auth";

export const GET = oAuthDiscoveryMetadata(auth);
```

- [ ] **Step 2: Protected-resource metadata**

`apps/web/src/app/.well-known/oauth-protected-resource/route.ts`:
```ts
import { oAuthProtectedResourceMetadata } from "better-auth/plugins";
import { auth } from "@/lib/auth";

export const GET = oAuthProtectedResourceMetadata(auth);
```

- [ ] **Step 3: Verify the endpoints serve JSON**

Run: `pnpm --filter web dev` (and `pnpm db:dev` in another shell). Then open in a browser:
- `http://localhost:3042/.well-known/oauth-authorization-server`
- `http://localhost:3042/.well-known/oauth-protected-resource`

Expected: both return JSON. The first lists `authorization_endpoint`, `token_endpoint`, `registration_endpoint` (DCR), `scopes_supported`. The second lists `resource` + `authorization_servers`.

- [ ] **Step 4: Confirm `IndexName` values (blocks Task 6 projection correctness)**

Open `packages/api/src/es/types.ts`. Confirm `IndexName` is the union `"public" | "direct" | "offline"`. If it is instead raw ES index names, update `toCompactRow`/`getContractByType` to map raw→logical and re-run `pnpm --filter web test`.

- [ ] **Step 5: Commit**
```bash
git add "apps/web/src/app/.well-known"
git commit -m "feat(mcp): expose OAuth discovery + protected-resource metadata"
```

---

## Task 5: Per-user rate limiter (Turso)

Better Auth's built-in limiter only guards Better Auth's own endpoints — MCP tool calls go through `@vercel/mcp-adapter`, so we enforce our own fixed-window limit (60 calls / 60s / user).

**Files:**
- Create: `apps/web/src/lib/mcp/rate-limit.ts`

- [ ] **Step 1: Implement the limiter**

`apps/web/src/lib/mcp/rate-limit.ts`:
```ts
import { and, eq } from "drizzle-orm";
import { db, mcpRateLimit } from "@/db/schema";

const LIMIT = 60; // calls
const WINDOW_MS = 60_000; // per minute

export class RateLimitError extends Error {
  constructor() {
    super("Rate limit exceeded: max 60 calls/minute. Please slow down.");
    this.name = "RateLimitError";
  }
}

export async function enforceRateLimit(userId: string): Promise<void> {
  const windowStart = Math.floor(Date.now() / WINDOW_MS);
  const id = `${userId}:${windowStart}`;

  const existing = await db
    .select({ count: mcpRateLimit.count })
    .from(mcpRateLimit)
    .where(and(eq(mcpRateLimit.id, id)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(mcpRateLimit).values({ id, userId, windowStart, count: 1 });
    return;
  }

  if (existing[0].count >= LIMIT) {
    throw new RateLimitError();
  }

  await db
    .update(mcpRateLimit)
    .set({ count: existing[0].count + 1 })
    .where(eq(mcpRateLimit.id, id));
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web typecheck`
Expected: no errors. (Verified end-to-end in Task 6.)

- [ ] **Step 3: Commit**
```bash
git add apps/web/src/lib/mcp/rate-limit.ts
git commit -m "feat(mcp): add Turso-backed per-user rate limiter"
```

---

## Task 6: The MCP route with 6 tools

**Files:**
- Create: `apps/web/src/app/api/[transport]/route.ts`

- [ ] **Step 1: Implement the handler + tools**

`apps/web/src/app/api/[transport]/route.ts`:
```ts
import { createMcpHandler } from "@vercel/mcp-adapter";
import { withMcpAuth } from "better-auth/plugins";
import { Logger } from "next-axiom";
import { z } from "zod";
import {
  getAuthorityByNationalId,
  getAuthorityTopSuppliers,
  getCompanyByNationalId,
  getCompanyTopAuthorities,
  getLocalityStats,
  getLocalityTopAuthorities,
  getLocalityTopCompanies,
  getLocalityTopCpv,
  getTotal,
  searchContracts,
} from "@sicap/api";
import { getContractByType } from "@/lib/mcp/contracts";
import { clampPerPage, toCompactRow } from "@/lib/mcp/format";
import { auth } from "@/lib/auth";
import { enforceRateLimit, RateLimitError } from "@/lib/mcp/rate-limit";

export const maxDuration = 60;

const text = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

const handler = withMcpAuth(auth, (req, session) => {
  const userId = session.userId;
  const log = new Logger();

  // Wraps every tool: rate-limit, time, log to Axiom, surface errors as text.
  const run = async (
    tool: string,
    meta: Record<string, unknown>,
    fn: () => Promise<unknown>,
  ) => {
    const started = Date.now();
    try {
      await enforceRateLimit(userId);
      const data = await fn();
      const resultCount = Array.isArray((data as { rows?: unknown[] })?.rows)
        ? (data as { rows: unknown[] }).rows.length
        : undefined;
      log.info("mcp.tool", {
        userId,
        tool,
        ...meta,
        resultCount,
        latencyMs: Date.now() - started,
        status: "ok",
      });
      await log.flush();
      return text(data);
    } catch (err) {
      const status = err instanceof RateLimitError ? "rate_limited" : "error";
      log.error("mcp.tool", {
        userId,
        tool,
        ...meta,
        latencyMs: Date.now() - started,
        status,
        message: (err as Error).message,
      });
      await log.flush();
      return text({ error: (err as Error).message });
    }
  };

  return createMcpHandler(
    (server) => {
      server.tool(
        "search_contracts",
        "Search Romanian public procurement contracts (licitatii=public tenders, achizitii directe=direct acquisitions, achizitii offline). Returns compact rows; use get_contract for full detail. Values are RON strings; dates ISO; cpv is the CPV procurement-category code.",
        {
          query: z.string().describe("Free-text query, e.g. company name, object, CPV"),
          db: z
            .array(z.enum(["public", "direct", "offline"]))
            .optional()
            .describe("Which datasets to search; default all"),
          dateFrom: z.string().optional().describe("ISO date lower bound"),
          dateTo: z.string().optional().describe("ISO date upper bound"),
          valueFrom: z.string().optional().describe("Min contract value (RON)"),
          valueTo: z.string().optional().describe("Max contract value (RON)"),
          cpv: z.string().optional().describe("CPV code filter"),
          authority: z.string().optional().describe("Contracting authority name/id"),
          supplier: z.string().optional().describe("Supplier/company name/id"),
          euFunds: z.boolean().optional().describe("Only EU-funded contracts"),
          page: z.number().optional().describe("1-based page; default 1"),
          perPage: z.number().optional().describe("Rows per page; default 10, max 50"),
        },
        async (args) =>
          run("search_contracts", { query: args.query }, async () => {
            const page = args.page ?? 1;
            const result = await searchContracts({
              query: args.query,
              page,
              perPage: clampPerPage(args.perPage),
              filters: {
                db: args.db,
                dateFrom: args.dateFrom,
                dateTo: args.dateTo,
                valueFrom: args.valueFrom,
                valueTo: args.valueTo,
                cpv: args.cpv,
                authority: args.authority,
                supplier: args.supplier,
                euFunds: args.euFunds,
              },
            });
            return { totalCount: result.total, page, rows: result.items.map(toCompactRow) };
          }),
      );

      server.tool(
        "get_contract",
        "Get the full detail of one contract by id and type (public|direct|offline).",
        {
          id: z.string(),
          type: z.enum(["public", "direct", "offline"]),
        },
        async (args) =>
          run("get_contract", { id: args.id, type: args.type }, () =>
            getContractByType(args.type, args.id),
          ),
      );

      server.tool(
        "get_company",
        "Look up a company (supplier) by its Romanian national/fiscal id (CUI). Returns the company profile and the authorities it most often contracts with.",
        { nationalId: z.string().describe("CUI / fiscal number") },
        async (args) =>
          run("get_company", { nationalId: args.nationalId }, async () => {
            const [profile, topAuthorities] = await Promise.all([
              getCompanyByNationalId({ nationalId: args.nationalId }),
              getCompanyTopAuthorities({ nationalId: args.nationalId }),
            ]);
            return { profile, topAuthorities };
          }),
      );

      server.tool(
        "get_authority",
        "Look up a contracting authority by its Romanian national/fiscal id (CUI). Returns the authority profile and its top suppliers.",
        { nationalId: z.string().describe("CUI / fiscal number") },
        async (args) =>
          run("get_authority", { nationalId: args.nationalId }, async () => {
            const [profile, topSuppliers] = await Promise.all([
              getAuthorityByNationalId({ nationalId: args.nationalId }),
              getAuthorityTopSuppliers({ nationalId: args.nationalId }),
            ]);
            return { profile, topSuppliers };
          }),
      );

      server.tool(
        "get_locality_stats",
        "Procurement statistics for a Romanian locality: totals plus top authorities, top companies, and top CPV categories.",
        {
          city: z.string().describe("Locality/city name"),
          county: z.string().describe("County (judet) name"),
        },
        async (args) =>
          run("get_locality_stats", { city: args.city, county: args.county }, async () => {
            const [stats, topAuthorities, topCompanies, topCpv] = await Promise.all([
              getLocalityStats({ city: args.city, county: args.county }),
              getLocalityTopAuthorities({ city: args.city, county: args.county }),
              getLocalityTopCompanies({ city: args.city, county: args.county }),
              getLocalityTopCpv({ city: args.city, county: args.county }),
            ]);
            return { stats, topAuthorities, topCompanies, topCpv };
          }),
      );

      server.tool(
        "get_totals",
        "Total number of indexed records per dataset (public tenders, direct acquisitions, offline). Cheap overview of dataset size.",
        {},
        async () => run("get_totals", {}, () => getTotal()),
      );
    },
    {
      capabilities: {
        tools: {
          search_contracts: { description: "Search procurement contracts" },
          get_contract: { description: "Get one contract by id+type" },
          get_company: { description: "Look up a company by CUI" },
          get_authority: { description: "Look up an authority by CUI" },
          get_locality_stats: { description: "Locality procurement stats" },
          get_totals: { description: "Dataset record totals" },
        },
      },
    },
    { basePath: "/api", maxDuration: 60, verboseLogs: false },
  )(req);
});

export { handler as GET, handler as POST, handler as DELETE };
```

- [ ] **Step 2: Typecheck and fix signature mismatches**

Run: `pnpm --filter web typecheck`
Expected: no errors. The entity-function param shapes (`getCompanyByNationalId`, `getAuthorityTopSuppliers`, `getLocality*`) were taken from the API index; if a signature differs (e.g. positional args, or `{ city, county }` vs `{ locality, county }`), open the corresponding file under `packages/api/src/es/{company,authority,locality}/` and adjust the call. Re-run until clean.

- [ ] **Step 3: Verify end-to-end with the MCP Inspector**

With `pnpm --filter web dev` + `pnpm db:dev` running:
```bash
npx @modelcontextprotocol/inspector
```
In the Inspector UI: Transport = "Streamable HTTP", URL = `http://localhost:3042/api/mcp`. It should trigger the OAuth flow (redirect to `/autentificare` → consent → back). After auth:
- `tools/list` shows all 6 tools.
- Call `get_totals` → returns `{ licitatii, achizitii, offline }`.
- Call `search_contracts` with `{ "query": "constructii" }` → returns `{ totalCount, page, rows: [...] }`, each row compact with a `url`.
- Call `search_contracts` with `{ "query": "x", "perPage": 999 }` → at most 50 rows.
- Call `get_contract` with an `id`+`type` from a search row → full document.

- [ ] **Step 4: Verify rate limiting**

In the Inspector, call any tool >60 times within a minute (or temporarily set `LIMIT = 3` in `rate-limit.ts`, retest, then revert). Expected: after the limit, tool returns `{ "error": "Rate limit exceeded: ..." }`. Revert any temporary change.

- [ ] **Step 5: Commit**
```bash
git add "apps/web/src/app/api/[transport]/route.ts"
git commit -m "feat(mcp): add MCP route with 6 read-only procurement tools"
```

---

## Task 7: Telemetry verification (Axiom)

Telemetry is already wired into Task 6's `run()` wrapper (`log.info("mcp.tool", { userId, tool, query, resultCount, latencyMs, status })`). This task only verifies it.

**Files:** none (verification only).

- [ ] **Step 1: Verify events reach Axiom**

With the app running against a real Axiom token (the same env the app already uses for `next-axiom`), make a few Inspector tool calls, then check the Axiom dataset for `mcp.tool` events carrying `userId`, `tool`, `query` (for search), `resultCount`, `latencyMs`, `status`. If running locally without Axiom credentials, confirm instead that `log.info("mcp.tool", …)` executes without throwing (no error in the dev console) — events flush in production.

- [ ] **Step 2: No commit** (no code change).

---

## Task 8: Consent page

Better Auth redirects the OAuth authorize step to `consentPage` (set to `/oauth/consent` in Task 3) with `client_id` and `scope` query params. Build a styled page that approves via `POST /api/auth/oauth2/consent` (`{ accept: true }`).

**Files:**
- Create: `apps/web/src/app/(main)/oauth/consent/page.tsx`
- Create: `apps/web/src/app/(main)/oauth/consent/consent-form.tsx`

- [ ] **Step 1: Confirm the consent client method**

In a scratch spot, check the Better Auth client types: `authClient.oauth2.consent` should exist (from the mcp/oidc plugin). Confirm via editor autocomplete on `apps/web/src/lib/auth-client.ts`'s `authClient`. If the method name differs, use a raw `fetch("/api/auth/oauth2/consent", { method: "POST", body: JSON.stringify({ accept }) })` instead in Step 3.

- [ ] **Step 2: Server component (reads params, requires session)**

`apps/web/src/app/(main)/oauth/consent/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ConsentForm } from "./consent-form";

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string; scope?: string }>;
}) {
  const { client_id, scope } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session) {
    redirect(`/autentificare?redirect=/oauth/consent`);
  }
  const scopes = (scope ?? "openid profile email").split(" ").filter(Boolean);

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="text-xl font-semibold">Autorizează accesul</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        O aplicație ({client_id ?? "necunoscută"}) cere acces la contul tău SICAP pentru:
      </p>
      <ul className="mt-3 list-disc pl-6 text-sm">
        {scopes.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <ConsentForm />
    </div>
  );
}
```

- [ ] **Step 3: Client approve/deny form**

`apps/web/src/app/(main)/oauth/consent/consent-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function ConsentForm() {
  const [busy, setBusy] = useState(false);

  async function decide(accept: boolean) {
    setBusy(true);
    // If authClient.oauth2.consent is unavailable, replace with a fetch to
    // POST /api/auth/oauth2/consent (see Task 8 Step 1).
    await authClient.oauth2.consent({ accept });
  }

  return (
    <div className="mt-6 flex gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => decide(true)}
        className="rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
      >
        Permite
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => decide(false)}
        className="rounded border px-4 py-2 disabled:opacity-50"
      >
        Refuză
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Verify the consent flow**

Re-run the Inspector OAuth flow (Task 6 Step 3) with a fresh client (clear prior grant). Expected: after `/autentificare`, the browser lands on the styled `/oauth/consent` page listing scopes; "Permite" completes the flow and the Inspector receives a token; an `oauth_consent` row exists for the user/client. "Refuză" cancels.

- [ ] **Step 5: typecheck + lint + fmt**

Run: `pnpm --filter web typecheck && pnpm lint && pnpm fmt`
Expected: clean.

- [ ] **Step 6: Commit**
```bash
git add "apps/web/src/app/(main)/oauth"
git commit -m "feat(mcp): add styled OAuth consent page"
```

---

## Task 9: Public `/mcp` docs page

A public page describing the connector + setup. No per-user state.

**Files:**
- Create: `apps/web/src/app/(main)/mcp/page.tsx`

- [ ] **Step 1: Implement the page**

`apps/web/src/app/(main)/mcp/page.tsx`:
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conector MCP — SICAP.ai",
  description:
    "Conectează datele de achiziții publice SICAP.ai în Claude sau alți agenți AI prin Model Context Protocol.",
};

const MCP_URL = `${process.env.BASE_URL ?? "https://sicap.ai"}/api/mcp`;

export default function McpPage() {
  return (
    <div className="mx-auto max-w-2xl py-12 prose dark:prose-invert">
      <h1>Conector MCP</h1>
      <p>
        Interoghează datele de achiziții publice din SICAP.ai direct din Claude sau din alți agenți
        compatibili MCP. Autentificarea se face cu contul tău SICAP (Google).
      </p>

      <h2>URL conector</h2>
      <pre>{MCP_URL}</pre>

      <h2>Claude (claude.ai / Desktop)</h2>
      <p>Settings → Connectors → Add custom connector → lipește URL-ul de mai sus.</p>

      <h2>Claude Code</h2>
      <pre>{`claude mcp add --transport http sicap ${MCP_URL}`}</pre>

      <h2>Cursor / VS Code</h2>
      <pre>{`{
  "mcpServers": {
    "sicap": { "url": "${MCP_URL}" }
  }
}`}</pre>

      <h2>Unelte disponibile</h2>
      <ul>
        <li><strong>search_contracts</strong> — caută contracte (licitații, achiziții directe, offline)</li>
        <li><strong>get_contract</strong> — detaliile unui contract</li>
        <li><strong>get_company</strong> — profil firmă după CUI</li>
        <li><strong>get_authority</strong> — profil autoritate contractantă după CUI</li>
        <li><strong>get_locality_stats</strong> — statistici pe localitate</li>
        <li><strong>get_totals</strong> — totaluri pe seturi de date</li>
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:3042/mcp`. Expected: page renders with the connector URL and all setup snippets; `/mcp` is reachable without auth.

- [ ] **Step 3: typecheck + lint + fmt**

Run: `pnpm --filter web typecheck && pnpm lint && pnpm fmt`
Expected: clean.

- [ ] **Step 4: Commit**
```bash
git add "apps/web/src/app/(main)/mcp"
git commit -m "feat(mcp): add public /mcp connector docs page"
```

---

## Task 10: End-to-end with a real Claude client

**Files:** none (verification only).

- [ ] **Step 1: Connect from Claude Code**

With the app running:
```bash
claude mcp add --transport http sicap http://localhost:3042/api/mcp
```
Complete the OAuth flow in the browser (login + consent). Then in a Claude Code session:
- Confirm the `sicap` server is connected and lists 6 tools.
- Ask: "Use sicap to find recent public tenders about 'spital' and show the top 5." → verify it calls `search_contracts` and returns compact rows with URLs.
- Ask it to open one result via `get_contract`.

- [ ] **Step 2: Negative checks**

- Disconnect/clear credentials and confirm an unauthenticated `tools/call` is rejected (401), not served anonymously.
- Confirm `/api/mcp` is **not** blocked by BotID (it must work for an automated client — it will, since the handler never calls `checkBot()`).

- [ ] **Step 3: No commit** (verification only).

---

## Task 11: Documentation

Per repo `CLAUDE.md`: meaningful features update `README.md`, `CLAUDE.md`, and `docs/architecture.md`.

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify: `apps/web/README.md` (if dev/run story changed — it did: new route + env expectations)

- [ ] **Step 1: CLAUDE.md** — under "Main Routes" add `/api/mcp` (OAuth MCP server) and `/mcp` (public docs); under "Database Schema" note the new `oauthApplication`, `oauthAccessToken`, `oauthConsent`, `mcp_rate_limit` tables; add a one-line "MCP server" bullet pointing to `docs/architecture.md`.

- [ ] **Step 2: docs/architecture.md** — add an "MCP Server" section: OAuth via Better Auth `mcp` plugin, the `app/api/[transport]/route.ts` handler, the 6 tools and which `@sicap/api` functions back them, the compact-projection rule, the Turso rate limiter, Axiom `mcp.tool` events, BotID exclusion note, and the discovery/consent routes.

- [ ] **Step 3: README.md** — short user-facing blurb: "Connect SICAP.ai to Claude/agents via MCP — see `/mcp`."

- [ ] **Step 4: Verify links/build**

Run: `pnpm --filter web build`
Expected: build succeeds (catches any route/type regression).

- [ ] **Step 5: Commit**
```bash
git add CLAUDE.md README.md docs/architecture.md apps/web/README.md
git commit -m "docs: document the MCP server (routes, tools, schema, ops)"
```

---

## Self-Review (against the spec)

**Spec coverage:**
- §3 D1 distribution+identity → Tasks 3,6 (OAuth + `userId` on every call). ✅
- §3 D2 OAuth-only → Task 3 (`mcp` plugin), no apiKey plugin. ✅
- §3 D3 curated 6 tools, read-only → Task 6. ✅
- §3 D4 compact JSON + pagination → Task 1 (`toCompactRow`, `clampPerPage`) + Task 6. ✅
- §3 D5 per-user burst limit → Task 5 + Task 6 wrapper. ✅ (spec wording corrected: custom limiter, not Better Auth's.)
- §3 D6 consent + open DCR → Task 3 (`consentPage`, DCR default-on) + Task 8. ✅
- §3 D7 full Axiom events incl. query → Task 6 `run()` + Task 7. ✅
- §3 D8 public docs page → Task 9. ✅
- §1 BotID exclusion → handled by omission; verified Task 10 Step 2. ✅
- §5 discovery + protected-resource routes → Task 4. ✅
- §8 schema migration (3 OAuth tables) → Task 3. ✅

**Deviations (intentional, flagged):** rate limiter is custom (Better Auth's limiter can't see adapter traffic); consent client-method + entity-function signatures carry one explicit confirm-then-implement step each (real integration boundaries, verified by typecheck/autocomplete — not lazy placeholders).

**Type consistency:** `ContractType` defined in `format.ts`, reused in `contracts.ts`; `toCompactRow`/`clampPerPage` names match between Task 1 and Task 6; `enforceRateLimit`/`RateLimitError` match between Task 5 and Task 6; `mcpRateLimit` table (Task 3) matches the limiter query (Task 5).

**Open items deferred (per spec §14):** static API keys, daily quotas/tiers, write tools, in-app connect dashboard.
