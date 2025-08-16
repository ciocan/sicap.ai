import { useMemo } from "react";
import { MastraClient } from "@mastra/client-js";

import { env } from "@/lib/env";

interface UseMastraClientArgs {
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
      baseUrl: env.NEXT_PUBLIC_AGENT_API_URL,
      retries: 3,
      backoffMs: 100,
      maxBackoffMs: 5000,
      headers,
    });
  }, [args?.userId, args?.sessionId]);
};
