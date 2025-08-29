import { mastra } from "@/agent/mastra";
import { auth } from "@sicap/data";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await req.json();

  if (!threadId) {
    return Response.json({ error: "Thread ID is required" }, { status: 400 });
  }

  const userId = session.user.id;
  const agent = mastra.getAgent("sicapAgent");

  if (agent.hasOwnMemory()) {
    try {
      const memory = await agent.getMemory();

      if (!memory) {
        return Response.json({ error: "Memory not found" }, { status: 404 });
      }

      try {
        const thread = await memory.getThreadById({ threadId });

        if (!thread) {
          return Response.json({ error: "Thread not found" }, { status: 404 });
        }

        if (thread.resourceId !== userId) {
          return Response.json({ error: "Thread does not belong to user" }, { status: 403 });
        }

        await memory.saveThread({
          thread: {
            ...thread,
            metadata: {
              isArchived: true,
            },
          },
        });

        return Response.json({ success: true }, { status: 200 });
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
