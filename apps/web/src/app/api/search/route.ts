import type { NextRequest } from "next/server";

import { saveSearch } from "@sicap/api";
import { auth } from "@sicap/data/auth";

import { dbIds } from "@/utils";

export const POST = async (request: NextRequest) => {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  const userId = session?.user?.id;
  const data = await request.json();
  const db = data?.db?.split(",") || dbIds;
  const remoteAddress = request.headers.get("x-forwarded-for");
  const userAgent = request.headers.get("user-agent");

  await saveSearch({
    ...data,
    db,
    userId,
    remoteAddress,
    userAgent,
  });

  return Response.json(data);
};
