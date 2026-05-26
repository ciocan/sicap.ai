import { type NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS } from "@/lib/mcp/cors";

// MCP clients (Inspector, claude.ai) call the OAuth register/token endpoints cross-origin from a
// browser, but Better Auth's handler doesn't set CORS on them. Wrapping the catch-all route handler
// to add CORS breaks its route registration on cold compile, so we add the headers here instead —
// middleware leaves the handler exports untouched. Scoped to just these two endpoints to avoid
// touching the cookie-setting login routes or duplicating headers Better Auth already sets.
export function proxy(req: NextRequest): NextResponse {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }
  const res = NextResponse.next();
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

export const config = {
  matcher: ["/api/auth/mcp/token", "/api/auth/mcp/register"],
};
