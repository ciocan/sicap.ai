import type { NextRequest, NextResponse } from "next/server";

export type NextHandler<T extends NextRequest = NextRequest> = (
  req: T,
  arg?: unknown,
) => Promise<Response> | Promise<NextResponse> | NextResponse | Response;
