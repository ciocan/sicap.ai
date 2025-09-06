import { Hono } from "hono";
import { handle } from "hono/vercel";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";

import {
  authMiddleware,
  errorHandler,
  corsMiddleware,
  verifyUserMiddleware,
} from "@/agent/lib/middleware";
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

export const maxDuration = 300;

const app = new Hono<Env>().basePath("/api/agent");

app.use("*", corsMiddleware);
app.use("*", authMiddleware);
app.onError(errorHandler);

app.post("/chat", verifyUserMiddleware, zValidator("json", ChatRequestSchema), chatHandler());

app.get("/threads", listThreadsHandler);
app.get("/threads/:threadId", getThreadHandler);
app.put("/threads/:threadId/archive", archiveThreadHandler);
app.put(
  "/threads/:threadId/gen-title",
  zValidator("json", GenerateTitleRequestSchema),
  generateTitleHandler(),
);

app.put(
  "/messages/:messageId/vote",
  zValidator("json", VoteMessageRequestSchema),
  voteMessageHandler(),
);

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.notFound(() => {
  throw new HTTPException(404, { message: "Route not found" });
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
export const OPTIONS = handle(app);
