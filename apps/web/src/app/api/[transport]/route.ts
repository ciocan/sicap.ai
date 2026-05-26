import { withMcpAuth } from "better-auth/plugins";
import { createMcpHandler } from "mcp-handler";
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
import { auth } from "@/lib/auth";
import { getContractBySlug } from "@/lib/mcp/contracts";
import { type ContractSlug, clampPerPage, toCompactRow } from "@/lib/mcp/format";
import { indexToSlug, slugToIndex } from "@/lib/mcp/index-map";
import { enforceRateLimit, RateLimitError } from "@/lib/mcp/rate-limit";

export const maxDuration = 60;

type ToolResult = { content: Array<{ type: "text"; text: string }> };

// The MCP SDK's generic server.tool() overloads trigger TS2589 ("type instantiation is
// excessively deep") and exhaust tsc's heap. We register tools through this minimal
// interface so the compiler skips that inference; Zod still validates inputs at runtime.
// Args is inferred from each handler's explicit annotation, not from the Zod schema.
interface McpToolServer {
  tool: <Args>(
    name: string,
    description: string,
    schema: Record<string, unknown>,
    handler: (args: Args) => Promise<ToolResult>,
  ) => void;
}

const asText = (data: unknown): ToolResult => ({
  content: [{ type: "text", text: JSON.stringify(data) }],
});

const mcpHandler = withMcpAuth(auth, (req, session) => {
  const userId = session.userId;
  const log = new Logger();

  const run = async (
    tool: string,
    meta: Record<string, unknown>,
    fn: () => Promise<unknown>,
  ): Promise<ToolResult> => {
    const started = Date.now();
    try {
      await enforceRateLimit(userId);
      const data = await fn();
      log.info("mcp.tool", {
        ...meta,
        userId,
        tool,
        latencyMs: Date.now() - started,
        status: "ok",
      });
      await log.flush();
      return asText(data);
    } catch (err) {
      const status = err instanceof RateLimitError ? "rate_limited" : "error";
      log.error("mcp.tool", {
        ...meta,
        userId,
        tool,
        latencyMs: Date.now() - started,
        status,
        message: (err as Error).message,
      });
      await log.flush();
      return asText({ error: (err as Error).message });
    }
  };

  return createMcpHandler(
    (serverRaw) => {
      const server = serverRaw as unknown as McpToolServer;

      server.tool(
        "search_contracts",
        "Search Romanian public procurement contracts. Datasets: licitatii (public tenders), achizitii (direct acquisitions), achizitii-offline. Returns compact rows; call get_contract for full detail. value is in RON, date is ISO, cpv is the CPV procurement-category code.",
        {
          query: z.string().describe("Free-text query: company, authority, object, or CPV"),
          db: z
            .array(z.enum(["licitatii", "achizitii", "achizitii-offline"]))
            .optional()
            .describe("Restrict to datasets; default all"),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
          valueFrom: z.string().optional(),
          valueTo: z.string().optional(),
          cpv: z.string().optional(),
          authority: z.string().optional().describe("Contracting authority name or CUI"),
          supplier: z.string().optional().describe("Supplier company name or CUI"),
          euFunds: z.boolean().optional(),
          page: z.number().optional().describe("1-based page; default 1"),
          perPage: z.number().optional().describe("rows per page; default 10, max 50"),
        },
        async (args: {
          query: string;
          db?: ContractSlug[];
          dateFrom?: string;
          dateTo?: string;
          valueFrom?: string;
          valueTo?: string;
          cpv?: string;
          authority?: string;
          supplier?: string;
          euFunds?: boolean;
          page?: number;
          perPage?: number;
        }) =>
          run("search_contracts", { query: args.query }, async () => {
            const page = args.page ?? 1;
            const db = args.db?.map((s) => slugToIndex(s)).filter((v): v is string => Boolean(v));
            const result = await searchContracts({
              query: args.query,
              page,
              perPage: clampPerPage(args.perPage),
              filters: {
                db,
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
            const rows = result.items.flatMap((it) => {
              const slug = indexToSlug(it.index);
              return slug ? [toCompactRow(it, slug)] : [];
            });
            return { totalCount: result.total, page, rows };
          }),
      );

      server.tool(
        "get_contract",
        "Get the full detail of one contract by id and dataset slug (licitatii | achizitii | achizitii-offline).",
        {
          id: z.string(),
          type: z.enum(["licitatii", "achizitii", "achizitii-offline"]),
        },
        async (args: { id: string; type: ContractSlug }) =>
          run("get_contract", { id: args.id, type: args.type }, () =>
            getContractBySlug(args.type, args.id),
          ),
      );

      server.tool(
        "get_company",
        "Look up a supplier company by its Romanian fiscal id (CUI/CIF). Returns the company profile plus the authorities it contracts with most.",
        { nationalId: z.string().describe("CUI / CIF fiscal number") },
        async (args: { nationalId: string }) =>
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
        "Look up a contracting authority by its Romanian fiscal id (CUI/CIF). Returns the authority profile plus its top suppliers.",
        { nationalId: z.string().describe("CUI / CIF fiscal number") },
        async (args: { nationalId: string }) =>
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
        "Procurement statistics for a Romanian locality: totals plus top authorities, companies, and CPV categories. Provide city and county (judet) names.",
        { city: z.string(), county: z.string().describe("Judet (county) name") },
        async (args: { city: string; county: string }) =>
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
        "Total indexed record counts per dataset (public tenders, direct acquisitions, offline).",
        {},
        async () => run("get_totals", {}, () => getTotal()),
      );
    },
    { capabilities: { tools: {} } },
    { basePath: "/api", maxDuration: 60, verboseLogs: false },
  )(req);
});

// MCP clients (Inspector, claude.ai, Cursor) call this cross-origin from a browser, so the
// transport endpoint must send CORS headers. createMcpHandler doesn't add them and Next's
// auto-OPTIONS lacks Access-Control-Allow-Origin, which fails the preflight ("Failed to fetch").
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, mcp-protocol-version, mcp-session-id, last-event-id",
  "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};

async function handler(req: Request): Promise<Response> {
  const res = await mcpHandler(req);
  const headers = new Headers(res.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export { handler as GET, handler as POST, handler as DELETE };
