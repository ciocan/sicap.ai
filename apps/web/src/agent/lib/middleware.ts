import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";

import { auth } from "@sicap/data";

import { countUserMessages } from "@/agent/lib/utils";
import { MESSAGE_LIMIT_UNVERIFIED } from "@/agent/lib/const";

// Auth middleware
export const authMiddleware = async (c: Context, next: Next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }

  c.set("userId", session.user.id);
  c.set("session", session);
  await next();
};

export const errorHandler = (err: Error, c: Context) => {
  console.error("API Error:", err);

  if (err instanceof HTTPException) {
    const status = err.status;
    const message = err.message || "Error";
    const cause = (err as unknown as { cause?: { code?: string } }).cause;
    return c.json({ error: message, code: cause?.code }, status);
  }

  return c.json({ error: "Internal Server Error" }, 500);
};

// CORS middleware
export const corsMiddleware = async (c: Context, next: Next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (c.req.method === "OPTIONS") {
    return c.text("", 200);
  }

  await next();
};

// validate user middleware
export const verifyUserMiddleware = async (c: Context, next: Next) => {
  const userId = c.get("userId") as string;
  const session = c.get("session");
  const phoneVerified = Boolean(session?.user?.phoneNumberVerified);

  if (phoneVerified) {
    await next();
    return;
  }

  const count = await countUserMessages(userId);

  if (Number(count) >= MESSAGE_LIMIT_UNVERIFIED) {
    throw new HTTPException(403, {
      message: "Verificarea telefonului este necesară",
      cause: { code: "PHONE_VERIFICATION_REQUIRED" },
    });
  }

  await next();
};
