import { eq } from "drizzle-orm";
import { db, mcpRateLimit } from "@/db/schema";

const LIMIT = 60; // calls
const WINDOW_MS = 60_000; // per minute

export class RateLimitError extends Error {
  constructor() {
    super("Rate limit exceeded: max 60 calls/minute. Please slow down.");
    this.name = "RateLimitError";
  }
}

/**
 * Fixed-window per-user limiter backed by Turso. Slight boundary over/undercount is
 * acceptable for throttling; the goal is to stop runaway agent loops, not exact metering.
 */
export async function enforceRateLimit(userId: string): Promise<void> {
  const windowStart = Math.floor(Date.now() / WINDOW_MS);
  const id = `${userId}:${windowStart}`;

  const existing = await db
    .select({ count: mcpRateLimit.count })
    .from(mcpRateLimit)
    .where(eq(mcpRateLimit.id, id))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(mcpRateLimit).values({ id, userId, windowStart, count: 1 });
    return;
  }

  if (existing[0].count >= LIMIT) {
    throw new RateLimitError();
  }

  await db
    .update(mcpRateLimit)
    .set({ count: existing[0].count + 1 })
    .where(eq(mcpRateLimit.id, id));
}
