import { Mastra } from "@mastra/core/mastra";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { PinoLogger } from "@mastra/loggers";
import { LangfuseExporter } from "langfuse-vercel";
import { registerApiRoute } from "@mastra/core/server";
import { openai } from "@ai-sdk/openai";

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
    apiRoutes: [
      registerApiRoute("/gen-title", {
        method: "POST",
        middleware: [
          async (c, next) => {
            // TODO: add auth middleware
            console.log(`!!!!!!! /gen-title ${c.req.method} ${c.req.url}`);
            await next();
          },
        ],
        handler: async (c) => {
          const mastra = c.get("mastra");
          const agent = mastra.getAgent("sicapAgent");
          const userId = c.req.header("x-user-id");

          if (!userId) {
            return c.json({ error: "userId is required" }, 400);
          }

          const { threadId } = await c.req.json();

          if (!threadId) {
            return c.json({ error: "threadId is required" }, 400);
          }

          const thread = await agent.fetchMemory({ threadId, resourceId: userId });

          const runtimeContext = new RuntimeContext();
          runtimeContext.set("resourceId", userId);

          if (thread.messages.filter((m) => m.role === "user").length > 1) {
            console.log("-------------------------------- not-generated");
            return c.json({ message: "not-generated" });
          }

          const title = await agent.genTitle(
            thread.messages[0],
            runtimeContext,
            openai("gpt-5-nano"),
            `
              - vei genera un titlu scurt pe baza primului mesaj cu care un utilizator începe o conversație
              - asigură-te că nu depășește 80 de caractere
              - titlul trebuie să fie un rezumat al mesajului utilizatorului
              - nu folosi ghilimele sau două puncte
              - întregul text returnat va fi folosit ca titlu
            `,
          );

          const memory = await agent.getMemory();

          if (!memory) {
            return c.json({ error: "Memory not found" }, 500);
          }

          await memory.createThread({
            threadId,
            resourceId: userId,
            title,
            metadata: {
              hasDefaultTitle: false,
            },
          });

          return c.json({ message: "OK", title });
        },
      }),
    ],
    middleware: [
      {
        path: "/*",
        handler: async (c, next) => {
          console.log("====================== AUTH MIDDLEWARE ==============================");
          // const a = await auth.api.getSession({
          //   headers: c.req.raw.headers,
          // });
          console.log("====================== --------------- ==============================");
          await next();
        },
      },
      {
        handler: async (c, next) => {
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
        path: "/*",
      },
    ],
  },
});
