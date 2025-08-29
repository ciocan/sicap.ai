"use client";
import { useMemo } from "react";
import { MastraClient } from "@mastra/client-js";

import { env } from "@/lib/env";

interface UseMastraClientArgs {
  sessionId?: string;
}

export const useMastraClient = (args?: UseMastraClientArgs) => {
  return useMemo(() => {
    const headers: Record<string, string> = {};

    if (args?.sessionId) {
      headers["x-session-id"] = args.sessionId;
    }

    const abortController = new AbortController();

    const client = new MastraClient({
      baseUrl: env.NEXT_PUBLIC_AGENT_API_URL,
      retries: 3,
      backoffMs: 100,
      maxBackoffMs: 5000,
      headers,
      credentials: "include",
      abortSignal: abortController.signal,
    });

    return { client, abortController };
  }, [args?.sessionId]);
};
