import { type NextRequest, NextResponse } from "next/server";

import { mastra } from "@/mastra";
import { auth } from "@/lib/auth";

export const POST = async (request: NextRequest) => {
  const data = await request.json();
  const session = await auth();
  const userId = session?.user?.id;

  console.log("session", session);
  console.log("data", JSON.stringify(data, null, 2));

  if (!session || !userId) {
    return new NextResponse("Neautorizat", { status: 401 });
  }

  const messages = data?.messages;
  const threadId = data?.threadId as string;

  const agent = mastra.getAgent("sicapAgent");

  try {
    const result = await agent.stream(messages, {
      memory: {
        thread: {
          id: threadId || crypto.randomUUID(),
        },
        resource: userId,
      },
      toolChoice: "auto",
      telemetry: {
        isEnabled: true,
        metadata: {
          userId,
          sessionId: threadId,
        },
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
