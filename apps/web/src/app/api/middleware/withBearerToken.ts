import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { NextHandler } from "./types";

export const withBearerToken = (handler: NextHandler) => {
  return async (req: NextRequest, res: NextResponse) => {
    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return new Response("Missing token", { status: 400 });
    }

    if (token !== env.API_SERVICES_TOKEN) {
      return new Response("Invalid token", { status: 403 });
    }

    return handler(req, res);
  };
};
