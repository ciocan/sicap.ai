"use client";
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

    // Check if we're in the browser before accessing sessionStorage
    if (typeof window !== "undefined") {
      const jwtToken = sessionStorage.getItem("jwt_token");

      if (jwtToken) {
        headers["Authorization"] = `Bearer ${jwtToken}`;
      }
    }

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
