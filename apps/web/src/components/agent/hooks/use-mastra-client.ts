import { useMemo } from "react";
import { MastraClient } from "@mastra/client-js";

import { env } from "@/lib/env";

interface UseMastraClientArgs {
  baseUrl?: string;
  userId?: string;
  sessionId?: string;
}

export const useMastraClient = (args?: UseMastraClientArgs) => {
  return useMemo(() => {
    const headers: Record<string, string> = {};

    if (args?.userId) {
      headers["x-user-id"] = args.userId;
    }

    if (args?.sessionId) {
      headers["x-session-id"] = args.sessionId;
    }

    return new MastraClient({
      baseUrl: args?.baseUrl ?? env.NEXT_PUBLIC_AGENT_API_URL ?? "http://localhost:4111",
      retries: 3,
      backoffMs: 100,
      maxBackoffMs: 5000,
      headers,
    });
  }, [args?.baseUrl, args?.userId, args?.sessionId]);
};
