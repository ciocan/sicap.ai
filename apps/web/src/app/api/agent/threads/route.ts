import { mastra } from "@/agent";
import { auth } from "@sicap/data";

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const agent = mastra.getAgent("sicapAgent");

  if (agent.hasOwnMemory()) {
    try {
      const memory = await agent.getMemory();

      if (!memory) {
        return Response.json({ error: "Memory not found" }, { status: 404 });
      }

      const allThreads = await memory.getThreadsByResourceId({
        resourceId: userId,
        orderBy: "updatedAt",
        sortDirection: "DESC",
      });

      const threads = allThreads.filter((thread) => !thread.metadata?.isArchived);

      return Response.json({ threads }, { status: 200 });
    } catch {
      return Response.json({ error: "Thread not found" }, { status: 404 });
    }
  }

  return Response.json({ error: "Agent does not have memory" }, { status: 400 });
}
