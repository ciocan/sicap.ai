import { mastra } from "@/agent/mastra";
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

      const threads = await memory.getThreadsByResourceId({
        resourceId: userId,
        orderBy: "createdAt",
        sortDirection: "DESC",
      });

      return Response.json({ threads }, { status: 200 });
    } catch {
      return Response.json({ error: "Thread not found" }, { status: 404 });
    }
  }

  return Response.json({ error: "Agent does not have memory" }, { status: 400 });
}
