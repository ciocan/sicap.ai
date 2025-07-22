import type { NextRequest } from "next/server";

import { env } from "@/lib/env";
import type { NextHandler } from "./types";

export const withBearerToken = <T extends NextRequest = NextRequest>(handler: NextHandler<T>) => {
  return async (req: T, context?: unknown) => {
    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return new Response("Missing token", { status: 400 });
    }

    if (token !== env.API_SERVICES_TOKEN) {
      return new Response("Invalid token", { status: 403 });
    }

    return handler(req, context);
  };
};
