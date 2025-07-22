import { NextRequest } from "next/server";

import { env } from "@/lib/env";
import { NextHandler } from "./types";

export const withBearerToken = (handler: NextHandler) => {
  // The wrapped function must conform to the Next.js Route Handler signature:
  // (request: NextRequest, context: { params: Record<string, string> }) => Response | Promise<Response>
  // We therefore accept the `context` object as the second parameter instead of a `NextResponse`.
  return async (req: NextRequest, context?: unknown) => {
    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return new Response("Missing token", { status: 400 });
    }

    if (token !== env.API_SERVICES_TOKEN) {
      return new Response("Invalid token", { status: 403 });
    }

    // Forward the original `context` object (if any) to the downstream handler.
    return handler(req, context);
  };
};
