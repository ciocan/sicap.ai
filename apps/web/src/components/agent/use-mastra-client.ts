import { useMemo } from "react";
import { MastraClient } from "@mastra/client-js";

export const useMastraClient = () => {
  return useMemo(
    () =>
      new MastraClient({
        baseUrl: "/api/agent",
        retries: 3,
        backoffMs: 100,
        maxBackoffMs: 5000,
        headers: {
          "x-mastra-client-type": "web",
        },
      }),
    [],
  );
};
