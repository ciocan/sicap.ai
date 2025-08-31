import type { Context } from "hono";
import type { UIMessage } from "ai";
import { RuntimeContext } from "@mastra/core/runtime-context";

import { getAgent } from "@/agent/lib/utils";
import type { Env, JsonInputSchema, ChatRequestSchema } from "@/agent/lib/schemas";

// POST /agent/chat
export function chatHandler<
  E extends Env,
  P extends string,
  I extends JsonInputSchema<typeof ChatRequestSchema>,
>() {
  return async (c: Context<E, P, I>) => {
    const userId = c.get("userId") as string;
    const validated = c.req.valid("json");
    const { threadId, message } = validated;

    const agent = getAgent();
    const runtimeContext = new RuntimeContext();
    runtimeContext.set("userId", userId);
    runtimeContext.set("threadId", threadId);

    const stream = await agent.stream([message] as unknown as UIMessage[], {
      runId: threadId,
      runtimeContext,
      memory: {
        thread: {
          id: threadId,
        },
        resource: userId,
      },
    });

    const response = new Response(
      stream.toUIMessageStreamResponse({
        sendReasoning: true,
        sendSources: true,
      }).body,
    );

    response.headers.set("Content-Type", "text/plain; charset=utf-8");
    response.headers.set("Cache-Control", "no-cache");

    return response;
  };
}
