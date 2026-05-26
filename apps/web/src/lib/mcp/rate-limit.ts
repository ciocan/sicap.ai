import { sql } from "drizzle-orm";
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
 * Fixed-window per-user limiter backed by Turso. The count is incremented atomically with a
 * single upsert (INSERT ... ON CONFLICT DO UPDATE ... RETURNING) so parallel tool calls can't
 * race past the limit. Goal is to stop runaway agent loops, not exact metering.
 */
export async function enforceRateLimit(userId: string): Promise<void> {
  const windowStart = Math.floor(Date.now() / WINDOW_MS);
  const id = `${userId}:${windowStart}`;

  const [row] = await db
    .insert(mcpRateLimit)
    .values({ id, userId, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: mcpRateLimit.id,
      set: { count: sql`${mcpRateLimit.count} + 1` },
    })
    .returning({ count: mcpRateLimit.count });

  if (row && row.count > LIMIT) {
    throw new RateLimitError();
  }
}
