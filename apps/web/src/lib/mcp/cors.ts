// MCP clients (Inspector, claude.ai, Cursor) call the MCP and OAuth endpoints cross-origin from a
// browser, so those routes must answer CORS preflights and echo CORS on the actual response.
// Two gaps need filling: Next's auto-generated OPTIONS returns 204 without
// Access-Control-Allow-Origin (failing the preflight with "Failed to fetch"), and Better Auth sets
// CORS on its .well-known discovery helpers but NOT on the OAuth flow endpoints (register/token)
// served by the catch-all handler. withCors mutates headers in place rather than rebuilding the
// Response so multi-value Set-Cookie (login) and streaming bodies (MCP SSE) are preserved untouched.

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, mcp-protocol-version, mcp-session-id, last-event-id",
  "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};

export function withCors(res: Response): Response {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
