import { oAuthProtectedResourceMetadata } from "better-auth/plugins";
import { auth } from "@/lib/auth";
import { corsPreflight } from "@/lib/mcp/cors";

// RFC 9728 path-aware location: MCP clients derive
// /.well-known/oauth-protected-resource/<resource-path> (e.g. /api/mcp) from the resource URL.
// Serve the same metadata there as at the root so stricter clients (claude.ai) discover it.
export const GET = oAuthProtectedResourceMetadata(auth);
export const OPTIONS = corsPreflight;
