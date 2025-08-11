import { useMemo } from "react";
import { MastraClient } from "@mastra/client-js";

import { env } from "@/lib/env";

interface UseMastraClientArgs {
  baseUrl?: string;
}

export const useMastraClient = (args?: UseMastraClientArgs) => {
  return useMemo(
    () =>
      new MastraClient({
        baseUrl: args?.baseUrl ?? env.NEXT_PUBLIC_AGENT_API_URL ?? "http://localhost:4111",
        retries: 3,
        backoffMs: 100,
        maxBackoffMs: 5000,
      }),
    [args?.baseUrl],
  );
};
