import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { mastra } from "@/mastra";

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) => {
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse("Neautorizat", { status: 401 });
  }

  const { threadId } = await params;
  const userId = session.user.id;

  try {
    const agent = mastra.getAgent("sicapAgent");
    const memory = await agent.getMemory();

    if (!memory) {
      return new NextResponse("Memorie indisponibila", { status: 500 });
    }

    const thread = await memory.getThreadById({ threadId });

    if (!thread || thread.resourceId !== userId) {
      return new NextResponse("Thread inexistent", { status: 404 });
    }

    const messages = await memory.storage.getMessages({
      threadId,
      resourceId: userId,
      format: "v1",
    });

    // const mod = messages.map((m) => ({ ...m, content: m.content }));
    // console.log("messages", JSON.stringify(messages, null, 2));

    return NextResponse.json(messages);
  } catch (error) {
    console.error(`/api/chat/${threadId} error`, error);
    return new NextResponse("Eroare interna", { status: 500 });
  }
};
