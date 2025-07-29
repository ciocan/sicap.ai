import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { mastra } from "@/mastra";

export const GET = async (_request: NextRequest) => {
  const session = await auth();

  const userId = session?.user?.id;

  if (!userId) {
    return new NextResponse("Neautorizat", { status: 401 });
  }

  try {
    const agent = mastra.getAgent("sicapAgent");
    const memory = await agent.getMemory();

    if (!agent?.getMemory()) {
      return new NextResponse(JSON.stringify([]), { status: 200 });
    }

    const threads = await memory?.getThreadsByResourceId({ resourceId: userId });

    console.log("threads", threads);

    return NextResponse.json(threads);
  } catch (error) {
    console.error("/api/chat/threads error", error);
    return new NextResponse("Eroare interna", { status: 500 });
  }
};
