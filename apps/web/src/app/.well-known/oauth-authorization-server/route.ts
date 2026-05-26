import { oAuthDiscoveryMetadata } from "better-auth/plugins";
import { auth } from "@/lib/auth";
import { corsPreflight } from "@/lib/mcp/cors";

export const GET = oAuthDiscoveryMetadata(auth);
export const OPTIONS = corsPreflight;
