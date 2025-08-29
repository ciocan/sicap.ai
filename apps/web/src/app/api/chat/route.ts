import type { UIMessage } from "ai";
import { RuntimeContext } from "@mastra/core/runtime-context";

import { mastra } from "@/agent/mastra";
import { auth } from "@sicap/data";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, threadId }: { messages: UIMessage[]; threadId: string } = await req.json();

  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    console.error(`===== 401 ==== UNAUTHORIZED ====`);
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  console.log("---- threadId ----", threadId);
  console.log("---- userId ----", userId);

  const agent = mastra.getAgent("sicapAgent");
  const runtimeContext = new RuntimeContext();
  runtimeContext.set("userId", userId);
  runtimeContext.set("threadId", threadId);

  const stream = await agent.streamVNext(messages, {
    runId: threadId,
    format: "aisdk",
    runtimeContext,
    memory: {
      thread: {
        id: threadId,
      },
      resource: userId,
    },
  });

  return new Response(
    stream.toUIMessageStreamResponse({
      originalMessages: messages,
      sendReasoning: true,
      sendSources: true,
    }).body,
  );
}
