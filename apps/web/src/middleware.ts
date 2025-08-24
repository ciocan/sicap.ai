import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";
import { Logger } from "next-axiom";

export const config = {
  runtime: "nodejs",
};

export const middleware = (request: NextRequest, event: NextFetchEvent) => {
  const logger = new Logger({ source: "middleware" });
  logger.middleware(request);

  event.waitUntil(logger.flush());

  return NextResponse.next();
};
