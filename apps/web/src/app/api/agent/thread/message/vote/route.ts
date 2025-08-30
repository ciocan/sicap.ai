import { mastra } from "@/agent/mastra";
import { auth } from "@sicap/data";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId, messageId, vote, branchIndex } = (await req.json()) as {
    threadId: string;
    messageId: string;
    vote: "up" | "down";
    branchIndex?: number;
  };

  if (!threadId || !messageId || !vote) {
    return Response.json({ error: "messageId and vote are required" }, { status: 400 });
  }

  const userId = session.user.id;
  const agent = mastra.getAgent("sicapAgent");

  if (agent.hasOwnMemory()) {
    try {
      const memory = await agent.getMemory();

      if (!memory) {
        return Response.json({ error: "Memory not found" }, { status: 404 });
      }

      const { uiMessages } = await memory.query({
        resourceId: userId,
        threadId,
        selectBy: {
          include: [{ id: messageId }],
        },
      });

      try {
        if (!uiMessages) {
          return Response.json({ error: "Message not found" }, { status: 404 });
        }

        const message = uiMessages.find((message) => message.id === messageId);

        if (!message) {
          return Response.json({ error: "Message not found" }, { status: 404 });
        }

        const storage = mastra.getStorage();

        if (!storage) {
          return Response.json({ error: "Storage not found" }, { status: 404 });
        }

        const updatedMessageMetadata = {
          id: messageId,
          content: {
            metadata: {
              vote: {
                ...(message.metadata?.vote ?? {}),
                [branchIndex ?? 0]: vote,
              },
            },
          },
        };

        const [updatedMessage] = await storage.updateMessages({
          messages: [updatedMessageMetadata],
        });

        return Response.json({ success: true, message: updatedMessage }, { status: 200 });
      } catch (error) {
        console.error("Failed to get thread:", error);
        return Response.json({ error: "Failed to get thread" }, { status: 500 });
      }
    } catch (error) {
      console.error("Failed to archive thread:", error);
      return Response.json({ error: "Failed to archive thread" }, { status: 500 });
    }
  }

  return Response.json({ error: "Agent does not have memory" }, { status: 400 });
}
