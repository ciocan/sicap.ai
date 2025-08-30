import { Hono } from "hono";
import { handle } from "hono/vercel";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";

import { authMiddleware, errorHandler, corsMiddleware } from "@/agent/lib/middleware";
import { chatHandler } from "@/agent/lib/handlers/chat";
import {
  listThreadsHandler,
  getThreadHandler,
  archiveThreadHandler,
  generateTitleHandler,
} from "@/agent/lib/handlers/threads";
import { voteMessageHandler } from "@/agent/lib/handlers/messages";
import {
  ChatRequestSchema,
  GenerateTitleRequestSchema,
  VoteMessageRequestSchema,
  type Env,
} from "@/agent/lib/schemas";

// Configure max duration for streaming
export const maxDuration = 300;

// Create Hono app
const app = new Hono<Env>().basePath("/api/agent");

// Add global middleware
app.use("*", corsMiddleware);
app.use("*", authMiddleware);
app.onError(errorHandler);

// Chat routes
app.post("/chat", zValidator("json", ChatRequestSchema), chatHandler());

// Thread routes
app.get("/threads", listThreadsHandler);
app.get("/threads/:threadId", getThreadHandler);
app.put("/threads/:threadId/archive", archiveThreadHandler);
app.put(
  "/threads/:threadId/gen-title",
  zValidator("json", GenerateTitleRequestSchema),
  generateTitleHandler(),
);

// Message routes
app.put(
  "/messages/:messageId/vote",
  zValidator("json", VoteMessageRequestSchema),
  voteMessageHandler(),
);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.notFound(() => {
  throw new HTTPException(404, { message: "Route not found" });
});

// Export handlers for Next.js
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
export const OPTIONS = handle(app);
