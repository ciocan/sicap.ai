import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getAgentMemory, validateThreadOwnership } from "../utils";
import type {
  GenerateTitleRequestSchema,
  ListThreadsResponse,
  SuccessResponse,
} from "@/agent/lib/schemas";
import { openai } from "@ai-sdk/openai";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { getAgent } from "@/agent/lib/utils";
import type { Env, JsonInputSchema } from "@/agent/lib/schemas";

// GET /agent/threads
export const listThreadsHandler = async (c: Context) => {
  const userId = c.get("userId") as string;
  const memory = await getAgentMemory();

  try {
    const allThreads = await memory.getThreadsByResourceId({
      resourceId: userId,
      orderBy: "updatedAt",
      sortDirection: "DESC",
    });

    const threads = allThreads.filter((thread) => !thread.metadata?.isArchived);

    const response: ListThreadsResponse = { threads };
    return c.json(response);
  } catch {
    throw new HTTPException(404, { message: "Thread not found" });
  }
};

// GET /agent/threads/:threadId
export const getThreadHandler = async (c: Context) => {
  const userId = c.get("userId") as string;
  const threadId = c.req.param("threadId");

  if (!threadId) {
    throw new HTTPException(400, { message: "Thread ID is required" });
  }

  const memory = await getAgentMemory();

  try {
    const { uiMessages } = await memory.query({
      resourceId: userId,
      threadId,
    });

    return c.json({ uiMessages });
  } catch {
    throw new HTTPException(404, { message: "Thread not found" });
  }
};

// PUT /agent/threads/:threadId/archive
export const archiveThreadHandler = async (c: Context) => {
  const userId = c.get("userId") as string;
  const threadId = c.req.param("threadId");

  if (!threadId) {
    throw new HTTPException(400, { message: "Thread ID is required" });
  }

  const memory = await getAgentMemory();
  const thread = await validateThreadOwnership(threadId, userId);

  try {
    await memory.saveThread({
      thread: {
        ...thread,
        metadata: {
          isArchived: true,
        },
      },
    });

    const response: SuccessResponse = { success: true };
    return c.json(response);
  } catch (error) {
    console.error("Failed to archive thread:", error);
    throw new HTTPException(500, { message: "Failed to archive thread" });
  }
};

// PUT /agent/threads/:threadId/title
export function generateTitleHandler<
  E extends Env,
  P extends string,
  I extends JsonInputSchema<typeof GenerateTitleRequestSchema>,
>() {
  return async (c: Context<E, P, I>) => {
    const userId = c.get("userId") as string;
    const threadId = c.req.param("threadId");
    const validated = c.req.valid("json");

    if (!threadId) {
      throw new HTTPException(400, { message: "Thread ID is required" });
    }

    const { message } = validated;

    const memory = await getAgentMemory();
    const thread = await validateThreadOwnership(threadId, userId);

    if (!thread.title?.startsWith("New Thread")) {
      throw new HTTPException(409, { message: "Thread already has a title" });
    }

    try {
      const agent = getAgent();
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

      const response: SuccessResponse = { success: true };
      return c.json(response);
    } catch (error) {
      console.error("Failed to generate title:", error);
      throw new HTTPException(500, { message: "Failed to generate title" });
    }
  };
}
