import { mastra } from "@/agent/mastra";
import { openai } from "@ai-sdk/openai";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { auth } from "@sicap/data";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId, message } = (await req.json()) as { threadId: string; message: string };

  if (!threadId || !message) {
    return Response.json({ error: "threadId and message are required" }, { status: 400 });
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

        if (!thread.title?.startsWith("New Thread")) {
          return Response.json({ error: "Thread already has a title" }, { status: 409 });
        }

        if (thread.resourceId !== userId) {
          return Response.json({ error: "Thread does not belong to user" }, { status: 403 });
        }

        const runtimeContext = new RuntimeContext();
        runtimeContext.set("resourceId", userId);

        const title = await agent.genTitle(
          { role: "user", content: message },
          runtimeContext,
          openai("gpt-5-nano"),
          `
              - vei genera un titlu scurt pe baza primului mesaj cu care un utilizator începe o conversație
              - asigură-te că nu depășește 80 de caractere
              - titlul trebuie să fie un rezumat al mesajului utilizatorului
              - nu folosi ghilimele sau două puncte
              - întregul text returnat va fi folosit ca titlu
            `,
        );

        await memory.saveThread({
          thread: {
            ...thread,
            title,
            metadata: {
              ...thread.metadata,
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
