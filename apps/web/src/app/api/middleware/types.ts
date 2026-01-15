import type { NextRequest, NextResponse } from "next/server";

export type NextHandler = (
  req: NextRequest,
  arg?: unknown,
) => Promise<Response> | Promise<NextResponse> | NextResponse | Response;
