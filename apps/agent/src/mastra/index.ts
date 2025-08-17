import { Mastra } from "@mastra/core/mastra";
import { RuntimeContext } from "@mastra/core/di";
import { PinoLogger } from "@mastra/loggers";
import { LangfuseExporter } from "langfuse-vercel";
import { registerApiRoute } from "@mastra/core/server";
import { VercelDeployer } from "@mastra/deployer-vercel";
import { openai } from "@ai-sdk/openai";

import { sicapAgent } from "./agents";
import { storage, VECTOR_STORE_NAME, vector } from "./stores";

import { auth } from "@sicap/data/auth";

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
  deployer: new VercelDeployer(),
  server: {
    cors: {
      origin: [process.env.BETTER_AUTH_URL ?? ""],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
      allowHeaders: ["Content-Type", "Authorization", "x-session-id", "x-resource-id", "Cookie"],
      credentials: true,
    },
    apiRoutes: [
      registerApiRoute("/gen-title", {
        method: "POST",
        handler: async (c) => {
          const mastra = c.get("mastra");
          const agent = mastra.getAgent("sicapAgent");
          // @ts-expect-error TODO: fix this
          const userId = c.get("userId");

          console.log("------ /gen-title: userId >>", userId, "<<");

          if (!userId) {
            console.error("/gen-title: missing userId");
            return c.json({ error: "missing userId" }, 500);
          }

          const { threadId } = await c.req.json();

          if (!threadId) {
            return c.json({ error: "threadId is required" }, 400);
          }

          // @ts-expect-error TODO: fix this
          const thread = await agent.fetchMemory({ threadId, resourceId: userId });

          if (thread.messages.filter((m) => m.role === "user").length > 1) {
            return c.json({ message: "not-generated" });
          }

          const runtimeContext = new RuntimeContext();
          runtimeContext.set("userId", userId);
          runtimeContext.set("resourceId", userId);

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
            // @ts-expect-error TODO: fix this
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
          if (["__refresh", "/api/telemetry"].some((path) => c.req.path.includes(path))) {
            return next();
          }

          const session = await auth.api.getSession({
            headers: c.req.raw.headers,
          });

          if (!session) {
            console.error(`===== 401 ===== ${c.req.method} ${c.req.path} ==== UNAUTHORIZED ====`);
            return c.json({ error: "Unauthorized" }, 401);
          }

          const sessionId = c.req.header("x-session-id");
          const userId = session.user.id;

          const runtimeContext = c.get("runtimeContext");
          runtimeContext.set("userId", userId);
          runtimeContext.set("sessionId", sessionId);

          c.set("userId", userId);

          console.log(`======== ${c.req.method} ${c.req.path}`);
          console.log("userId - sessionId", userId, sessionId);

          await next();
        },
      },
    ],
  },
});
