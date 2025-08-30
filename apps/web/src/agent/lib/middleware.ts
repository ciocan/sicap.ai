import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";

import { auth } from "@sicap/data";
import type { ErrorResponse } from "./schemas";

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

// Error handler middleware
export const errorHandler = (err: Error, c: Context) => {
  console.error("API Error:", err);

  if (err instanceof HTTPException) {
    const response: ErrorResponse = {
      error: err.message,
      code: err.status.toString(),
    };
    return c.json(response, err.status);
  }

  const response: ErrorResponse = {
    error: "Internal Server Error",
    code: "500",
  };
  return c.json(response, 500);
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
