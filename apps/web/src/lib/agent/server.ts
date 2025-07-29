import { randomUUID } from "node:crypto";
import type { Mastra } from "@mastra/core";
import { Telemetry } from "@mastra/core";
import { RuntimeContext } from "@mastra/core/runtime-context";
import type { Tool } from "@mastra/core/tools";
import type { Context, MiddlewareHandler } from "hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { timeout } from "hono/timeout";
import { describeRoute, openAPISpecs } from "hono-openapi";

import { errorHandler } from "./handlers/error";
import { rootHandler } from "./handlers/root";
import { agentsRouter } from "./handlers/agents/router";
import { logsRouter } from "./handlers/logs/router";
import { memoryRoutes } from "./handlers/memory/router";
import { scoresRouter } from "./handlers/scores/router";
import { telemetryRouter } from "./handlers/telemetry/router";
import { toolsRouter } from "./handlers/tools/router";
import { vectorRouter } from "./handlers/vector/router";
import { workflowsRouter } from "./handlers/workflows/router";
import type { ServerBundleOptions } from "./types";
import { authenticationMiddleware, authorizationMiddleware } from "./handlers/auth";

type Bindings = {};

type Variables = {
  mastra: Mastra;
  runtimeContext: RuntimeContext;
  clients: Set<{ controller: ReadableStreamDefaultController }>;
  tools: Record<string, Tool>;
  playground: boolean;
  isDev: boolean;
};

export async function createHonoServer(
  mastra: Mastra,
  options: ServerBundleOptions = {
    tools: {},
  },
) {
  // Create typed Hono app
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().basePath("/api/agent");
  const server = mastra.getServer();

  // Middleware
  app.use("*", async function setTelemetryInfo(c, next) {
    const requestId = c.req.header("x-request-id") ?? randomUUID();
    const span = Telemetry.getActiveSpan();
    if (span) {
      span.setAttribute("http.request_id", requestId);
      span.updateName(`${c.req.method} ${c.req.path}`);

      const newCtx = Telemetry.setBaggage({
        "http.request_id": { value: requestId },
      });

      await new Promise((resolve) => {
        Telemetry.withContext(newCtx, async () => {
          await next();
          resolve(true);
        });
      });
    } else {
      await next();
    }
  });

  app.onError((err, c) => errorHandler(err, c, options.isDev));

  // Add Mastra to context
  app.use("*", async function setContext(c, next) {
    let runtimeContext = new RuntimeContext();

    if (c.req.method === "POST" || c.req.method === "PUT") {
      const contentType = c.req.header("content-type");
      if (contentType?.includes("application/json")) {
        try {
          const clonedReq = c.req.raw.clone();
          const body = (await clonedReq.json()) as { runtimeContext?: Record<string, any> };
          if (body.runtimeContext) {
            runtimeContext = new RuntimeContext(Object.entries(body.runtimeContext));
          }
        } catch {
          // Body parsing failed, continue without body
        }
      }
    }

    c.set("runtimeContext", runtimeContext);
    c.set("mastra", mastra);
    c.set("tools", options.tools);
    return next();
  });

  // Apply custom server middleware from Mastra instance
  const serverMiddleware = mastra.getServerMiddleware?.();

  if (serverMiddleware && serverMiddleware.length > 0) {
    for (const m of serverMiddleware) {
      app.use(m.path, m.handler);
    }
  }

  //Global cors config
  if (server?.cors === false) {
    app.use("*", timeout(server?.timeout ?? 3 * 60 * 1000));
  } else {
    const corsConfig = {
      origin: "*",
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: false,
      maxAge: 3600,
      ...server?.cors,
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "x-mastra-client-type",
        ...(server?.cors?.allowHeaders ?? []),
      ],
      exposeHeaders: ["Content-Length", "X-Requested-With", ...(server?.cors?.exposeHeaders ?? [])],
    };
    app.use("*", timeout(server?.timeout ?? 3 * 60 * 1000), cors(corsConfig));
  }

  // Run AUTH middlewares after CORS middleware
  app.use("*", authenticationMiddleware);
  app.use("*", authorizationMiddleware);

  const bodyLimitOptions = {
    maxSize: server?.bodySizeLimit ?? 4.5 * 1024 * 1024, // 4.5 MB,
    onError: (c: Context) => c.json({ error: "Request body too large" }, 413),
  };

  const routes = server?.apiRoutes;

  if (server?.middleware) {
    const normalizedMiddlewares = Array.isArray(server.middleware)
      ? server.middleware
      : [server.middleware];
    const middlewares = normalizedMiddlewares.map((middleware) => {
      if (typeof middleware === "function") {
        return {
          path: "*",
          handler: middleware,
        };
      }

      return middleware;
    });

    for (const middleware of middlewares) {
      app.use(middleware.path, middleware.handler);
    }
  }

  if (routes) {
    for (const route of routes) {
      const middlewares: MiddlewareHandler[] = [];

      if (route.middleware) {
        middlewares.push(
          ...(Array.isArray(route.middleware) ? route.middleware : [route.middleware]),
        );
      }
      if (route.openapi) {
        middlewares.push(describeRoute(route.openapi));
      }

      const handler = "handler" in route ? route.handler : await route.createHandler({ mastra });

      if (route.method === "GET") {
        app.get(route.path, ...middlewares, handler);
      } else if (route.method === "POST") {
        app.post(route.path, ...middlewares, handler);
      } else if (route.method === "PUT") {
        app.put(route.path, ...middlewares, handler);
      } else if (route.method === "DELETE") {
        app.delete(route.path, ...middlewares, handler);
      } else if (route.method === "ALL") {
        app.all(route.path, ...middlewares, handler);
      }
    }
  }

  if (server?.build?.apiReqLogs) {
    app.use(logger());
  }

  // API routes
  app.get(
    "/api",
    describeRoute({
      description: "Get API status",
      tags: ["system"],
      responses: {
        200: {
          description: "Success",
        },
      },
    }),
    rootHandler,
  );

  // Agents routes
  app.route("/api/agents", agentsRouter(bodyLimitOptions));
  // Network Memory routes
  app.route("/api/memory", memoryRoutes(bodyLimitOptions));
  // Telemetry routes
  app.route("/api/telemetry", telemetryRouter());
  // Legacy Workflow routes
  app.route("/api/workflows", workflowsRouter(bodyLimitOptions));
  // Log routes
  app.route("/api/logs", logsRouter());
  // Scores routes
  app.route("/api/scores", scoresRouter(bodyLimitOptions));
  // Tool routes
  app.route("/api/tools", toolsRouter(bodyLimitOptions, options.tools));
  // Vector routes
  app.route("/api/vector", vectorRouter(bodyLimitOptions));

  if (options?.isDev || server?.build?.openAPIDocs || server?.build?.swaggerUI) {
    app.get(
      "/openapi.json",
      openAPISpecs(app, {
        includeEmptyPaths: true,
        documentation: {
          info: { title: "Mastra API", version: "1.0.0", description: "Mastra API" },
        },
      }),
    );
  }

  // Catch-all route to serve index.html for any non-API routes
  app.get("*", async (c, next) => {
    // Skip if it's an API route
    if (c.req.path.startsWith("/api/") || c.req.path.startsWith("/openapi.json")) {
      return await next();
    }

    return c.newResponse("Hello from Hono!", 200, { "Content-Type": "text/html" });
  });

  return app;
}
