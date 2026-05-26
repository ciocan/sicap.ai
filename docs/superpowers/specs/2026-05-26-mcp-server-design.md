# MCP Server for Authenticated Users — Design

- **Date:** 2026-05-26
- **Status:** Approved (design), pending implementation plan
- **Scope:** `apps/web` (new MCP route, OAuth provider, consent page, public docs page), `packages/api` (reused as-is), one Drizzle migration
- **Depends on:** [Better Auth migration](./2026-05-26-better-auth-migration-design.md) (Better Auth must be live first)

## 1. Context & Motivation

Expose SICAP.ai's Romanian public-procurement search to **authenticated users from inside Claude (claude.ai, Desktop, Code) and other MCP-capable agents** (Cursor, VS Code, etc.). The procurement data is already public; gating behind auth is for **distribution + identity**: one-click connect, per-user rate limiting, and per-user usage analytics (with a hook for premium tiers later).

We add a **remote OAuth-authenticated MCP server hosted inside the existing Next.js app**, built on Better Auth's first-class `mcp` plugin and `@vercel/mcp-adapter`. The MCP tools are thin orchestration over the existing `packages/api` query functions — no new data layer.

### Resolved by inspection (no longer open questions)

- **Better Auth `mcp` plugin exists** in the installed `better-auth@1.6.11` (`better-auth/plugins` → `mcp`, `withMcpAuth`, `oAuthDiscoveryMetadata`). It turns the app into an OAuth 2.0 provider with Dynamic Client Registration (DCR), authorization codes, access/refresh tokens, and a consent flow. (Earlier "not available in 1.6.11" assessment was wrong.)
- **Login page** already exists at `/autentificare` → use as the plugin's `loginPage`.
- **Deployment is self-hosted Docker** (long-lived Node, not serverless) → use the **stateless Streamable HTTP** transport; **no Redis** required; no `maxDuration` concern.
- **`packages/api` exposes ~25 read query functions** (search, contract/company/authority/locality lookups, totals) — all async, typed, ready to wrap. No REST wrapper exists today; this is the first programmatic surface.
- **ES client** is bounded (`requestTimeout: 8000`, `maxRetries: 1`) → a single tool call cannot hang indefinitely.
- ⚠️ **`next.config.ts` wraps the app in `withBotId`** (Vercel BotID bot-detection). MCP clients *are* bots — the MCP route **must be excluded** from BotID or every agent is blocked.
- **Axiom** (`next-axiom`) is already wired → reuse for per-call MCP telemetry.
- `next.config.ts` defines `cacheLife` profiles (`totals`, `contracts`) → `get_totals` / `get_contract` can reuse cached server functions.

## 2. Goals / Non-Goals

**Goals**
- Remote MCP server at `https://sicap.ai/api/mcp`, connectable from Claude + other agents via OAuth.
- Identity (`userId`) on every tool call.
- 6 curated, read-only, token-respectful tools over existing `packages/api` functions.
- Per-user burst rate limiting.
- Full per-call usage analytics in Axiom.
- Public docs/landing page describing the connector + setup steps.

**Non-Goals (deferred)**
- Static API keys / bearer tokens for non-OAuth clients (add Better Auth `apiKey` plugin later if a real headless consumer appears).
- Daily quotas / tiered premium limits (burst limit only at launch).
- Write/stateful tools (e.g. save search, alerts) — read-only at launch.
- In-app authenticated "connect" dashboard with per-user connection status.

## 3. Decisions (from design interview)

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Why auth on public data | **Distribution + identity** | One-click connect, per-user limits/analytics, future premium hook |
| 2 | Auth mechanism | **OAuth only** (Better Auth `mcp` plugin) | Covers entire Claude ecosystem + Cursor/VS Code via DCR, no token pasting; API keys deferred |
| 3 | Tool surface | **Curated 6 tools**, read-only | Matches agent reasoning (search → drill in → look up parties); legible tool list |
| 4 | Result shape | **Compact JSON + pagination** | Tool results enter agent context; full ES docs would blow the token budget |
| 5 | Rate limiting | **Per-user burst (~60/min)** via Better Auth limiter, Turso-backed | Stops runaway loops/scraping, ~zero new infra; daily quota deferred |
| 6 | Consent / registration | **Consent screen + open DCR** | Standard OAuth UX, auditable per-user grant + revocation; open DCR fine (public data + throttle + revoke) |
| 7 | Observability | **Full Axiom events incl. query text** | Knowing what users search drives roadmap; reuses existing Axiom |
| 8 | Onboarding | **Public docs/landing page** (`/mcp`) | Top-of-funnel discovery; auth happens at connect-time via OAuth |

## 4. Architecture

```
Claude / agent
  │  1. discover  → GET /.well-known/oauth-protected-resource   (resource metadata)
  │               → GET /.well-known/oauth-authorization-server (oAuthDiscoveryMetadata(auth))
  │  2. register  → DCR (open) → oauthApplication row
  │  3. authorize → /autentificare (Google login) → consent screen → code
  │  4. token     → access + refresh tokens (oauthAccessToken)
  │  5. call      → POST /api/mcp  (Authorization: Bearer <access_token>)
  ▼
withMcpAuth(auth, (req, session) => createMcpHandler(...)(req))   // session = { userId, scopes, accessToken }
  ▼
rate-limit (per userId) → tool handler → packages/api fn → Elasticsearch
  ▼
compact JSON result  +  Axiom event { userId, tool, query, resultCount, latencyMs, status }
```

**Auth config** (`apps/web/src/lib/auth.ts`): add `mcp({ loginPage: "/autentificare", resource: "https://sicap.ai/api/mcp" })` to `plugins`. Scopes: default `openid profile email offline_access` (no custom scopes — single read-only tier).

**Transport:** stateless Streamable HTTP (`@vercel/mcp-adapter` `createMcpHandler`, no `redisUrl`).

## 5. Routes / File Layout

| Path | File | Purpose |
|------|------|---------|
| `POST /api/mcp` (+ `[transport]`) | `apps/web/src/app/api/[transport]/route.ts` | MCP handler via `withMcpAuth` + `createMcpHandler`; `basePath: "/api"`; exports `GET/POST/DELETE` |
| `/.well-known/oauth-authorization-server` | `apps/web/src/app/.well-known/oauth-authorization-server/route.ts` | `export const GET = oAuthDiscoveryMetadata(auth)` |
| `/.well-known/oauth-protected-resource` | `…/oauth-protected-resource/route.ts` | Protected-resource metadata (points clients at the auth server) |
| OAuth consent UI | authorize/consent page (styled) | Lists scopes, approve/deny; backed by the plugin's consent endpoint |
| `/mcp` | `apps/web/src/app/(main)/mcp/page.tsx` | Public docs: connector URL + setup snippets (claude.ai, Claude Code, Cursor) |
| BotID config | `next.config.ts` / middleware | **Exclude `/api/mcp` and `/.well-known/*` from BotID** |

## 6. Tool Surface (6 tools, read-only)

All inputs validated with `zod`. Descriptions in **English** for agent reasoning, but **explain Romanian domain terms** (CPV = procurement category code; `autoritate contractantă` = contracting authority; `licitație` = public tender; `achiziție directă` = direct acquisition; `achiziție offline`). Server `instructions` string states: "Search engine over Romanian public procurement (e-licitatie.ro)."

| Tool | Backing `packages/api` fn(s) | Input | Output (compact) |
|------|------------------------------|-------|------------------|
| `search_contracts` | `searchContracts({query,page,perPage,filters})` | `query`, optional filters (`db[]`, `dateFrom/To`, `valueFrom/To`, `cpv`, `authority`, `supplier`, locality/county fields, `euFunds`), `page`, `perPage` (default 10, **cap 50**) | `{ totalCount, page, rows: [{ id, type, object, authority, supplier, value, currency, date, cpv, url }] }` |
| `get_contract` | `getContractLicitatii/Achizitii/AchizitiiOffline(id)` dispatched by `type` | `id`, `type` (`public`\|`direct`\|`offline`) | Full contract document |
| `get_company` | `get-company-by-national-id` + `get-company-top-authorities` | `nationalId` | Profile + aggregates (top authorities, totals, `url`) |
| `get_authority` | `get-authority-by-national-id` + `get-authority-acquisitions` + `get-authority-top-suppliers` | `nationalId` | Profile + aggregates (acquisitions summary, top suppliers, `url`) |
| `get_locality_stats` | `get-locality-stats` + top-authorities/companies/cpv (+ related) | locality/county identifiers | Stats + top authorities/companies/CPV |
| `get_totals` | `getTotal()` | — | `{ licitatii, achizitii, offline }` (cache-backed) |

## 7. Result Shaping Rules

- `search_contracts`: project a **fixed compact field set** per row + `totalCount` + page info; default 10 rows, hard cap 50; include a canonical `sicap.ai` URL per row so users can click through and so the agent can deep-link.
- Detail tools (`get_contract`, `get_company`, `get_authority`): return the fuller document — the agent asked for one specific entity.
- **Errors** returned as clear MCP error content (no-results, invalid id/nationalId, ES timeout) so the agent can recover rather than crash.

## 8. Schema Changes

Enable `mcp()` → run `npx @better-auth/cli generate` → adds OAuth tables to `apps/web/src/db/schema.ts`, then `pnpm db:generate` + `pnpm db:migrate`:

- `oauthApplication` — registered clients (created via DCR)
- `oauthAccessToken` — issued access/refresh tokens
- `oauthConsent` — per-user consent grants (powers the consent screen + revocation)

(Plus any rate-limit storage table if Better Auth's limiter is configured to persist to Turso.)

## 9. Rate Limiting

Per-user burst limit (~60 calls/min/user) via Better Auth's built-in rate limiter, **backed by Turso** (in-memory is unsafe even on a single Docker node across restarts). Keyed by `session.userId`. ES timeout (8s) remains the per-call ceiling. Daily quota / tiers deferred.

## 10. Observability

Per tool call emit an Axiom event: `{ userId, tool, query/args, resultCount, latencyMs, status }`. Powers usage analytics, tool-popularity, and query-trend insight. Query text is logged (public data, but PII-adjacent — acceptable per decision #7).

## 11. Onboarding

Public `/mcp` page (Romanian UI copy) with: the connector URL, "Add custom connector" steps for claude.ai, the `claude mcp add --transport http sicap https://sicap.ai/api/mcp` command for Claude Code, and a Cursor/VS Code snippet. Auth happens at connect-time (Google login + consent), so the page needs no per-user state.

## 12. Implementation Gotchas

- **BotID** must skip `/api/mcp` + `/.well-known/*` (else agents are blocked). Highest-risk item.
- DCR is **open** — acceptable (public data, per-user throttle, revocable grants), but monitor `oauthApplication` growth.
- `@vercel/mcp-adapter` works without Redis on a long-lived Node server (stateless Streamable HTTP).
- Reuse `cacheLife` profiles for `get_totals` / `get_contract`.
- Tool descriptions must teach the agent the Romanian domain vocabulary.

## 13. Build Sequence

1. Add deps: `@vercel/mcp-adapter`, `zod` (if not present).
2. Enable `mcp()` plugin in `auth.ts`; generate + run migration (§8).
3. Add discovery routes (§5) + exclude paths from BotID.
4. Implement `withMcpAuth` + `createMcpHandler` route with the 6 tools (§6) over `packages/api`.
5. Add per-user rate limiting (§9) + Axiom instrumentation (§10).
6. Style the consent/authorize page.
7. Build the public `/mcp` docs page (§11).
8. End-to-end test: connect from Claude Code (`claude mcp add`) and claude.ai; verify login → consent → tool calls → rate limit → Axiom events.

## 14. Open / Deferred Items

- Static **API keys** (Better Auth `apiKey` plugin) for headless/non-OAuth agents.
- **Daily quotas / premium tiers** (counter table + reset).
- **Write tools** (saved searches, alerts) requiring user-scoped data.
- In-app authenticated **connect dashboard** with live connection status.
