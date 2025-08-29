import type { UIMessage } from "ai";

import { mastra } from "@/agent/mastra";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const agent = mastra.getAgent("sicapAgent");

  const stream = await agent.streamVNext(messages, {
    format: "aisdk",
  });

  return new Response(
    stream.toUIMessageStreamResponse({
      originalMessages: messages,
      sendReasoning: true,
      sendSources: true,
    }).body,
  );
}
