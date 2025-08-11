import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LangfuseExporter } from "langfuse-vercel";

import { sicapAgent } from "./agents";
import { storage, VECTOR_STORE_NAME, vector } from "./stores";
// import { env } from "@/lib/env";
// import { auth } from "@/lib/auth";

const logger = new PinoLogger({
  name: "SICAP Agent",
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
      allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: false,
    },
    middleware: [
      {
        handler: async (c, next) => {
          // const session = await auth();
          // const userId = session?.user?.id;
          // const resourceId = c.req.query("resourceid") || userId;

          const body = c.req.method.toUpperCase() === "POST" ? await c.req.json() : undefined;
          const formattedBody = body ? JSON.stringify(body, null, 2) : undefined;

          const ignoreEndpoints = [
            "/api/telemetry",
            "/api/agents/sicapAgent/voice",
            "/api/agents/sicapAgent/evals",
            "/api/scores",
          ].some((endpoint) => c.req.path.includes(endpoint));

          if (!ignoreEndpoints) {
            console.log("----------------------------------------------------------------");
            console.log("Middleware request", {
              method: c.req.method,
              path: c.req.path,
              query: c.req.query(),
              body: formattedBody,
              // cookie: c.req.raw.headers.get("cookie"),
              // headers: c.req.raw.headers,
            });
          }

          // if (userId !== resourceId) {
          //   return c.json({ error: "Unauthorized" }, 401);
          // }

          await next();
        },
        path: "/api/*",
      },
    ],
  },
});
