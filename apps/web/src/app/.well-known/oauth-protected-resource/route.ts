import { oAuthProtectedResourceMetadata } from "better-auth/plugins";
import { auth } from "@/lib/auth";
import { corsPreflight } from "@/lib/mcp/cors";

export const GET = oAuthProtectedResourceMetadata(auth);
export const OPTIONS = corsPreflight;
