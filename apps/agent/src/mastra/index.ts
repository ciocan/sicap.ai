import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LangfuseExporter } from "langfuse-vercel";

import { sicapAgent } from "./agents";
import { storage, VECTOR_STORE_NAME, vector } from "./stores";

const logger = new PinoLogger({
  name: "sicapAgent",
  level: "info",
});

export const mastra = new Mastra({
  agents: { sicapAgent },
  storage,
  vectors: {
    [VECTOR_STORE_NAME]: vector,
  },
  logger,
  telemetry: {
    serviceName: "ai",
    enabled: true,
    sampling: {
      type: "always_on",
    },
    export: {
      type: "custom",
      exporter: new LangfuseExporter({
        publicKey: process.env.LANGFUSE_PUBLIC_KEY,
        secretKey: process.env.LANGFUSE_SECRET_KEY,
        baseUrl: process.env.LANGFUSE_BASEURL,
      }),
    },
  },
  server: {
    cors: {
      origin: "*",
      allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
      allowHeaders: ["Content-Type", "Authorization", "x-user-id", "x-session-id", "x-resource-id"],
      credentials: false,
    },
    middleware: [
      {
        handler: async (c, next) => {
          // const session = await auth();
          // const userId = session?.user?.id;
          // const resourceId = c.req.query("resourceid") || userId;

          // Extract userId from headers for Langfuse tracking
          const userId = c.req.header("x-user-id");
          const sessionId = c.req.header("x-session-id");

          const runtimeContext = c.get("runtimeContext");
          runtimeContext.set("userId", userId);
          runtimeContext.set("sessionId", sessionId);

          const ignoreEndpoints = [
            "/api/telemetry",
            "/api/agents/sicapAgent/voice",
            "/api/agents/sicapAgent/evals",
            "/api/scores",
          ].some((endpoint) => c.req.path.includes(endpoint));

          if (!ignoreEndpoints) {
            console.log("----------------------------------------------------------------");
            if (c.req.path.includes("/api/agents/sicapAgent/stream")) {
              console.log("------------STREAM----------------------------------------------------");
            }
            console.log("Middleware request", {
              method: c.req.method,
              path: c.req.path,
              query: c.req.query(),
              userId,
              sessionId,
              // cookie: c.req.raw.headers.get("cookie"),
              // headers: c.req.raw.headers,
            });
          }

          await next();
        },
        path: "/api/*",
      },
    ],
  },
});
