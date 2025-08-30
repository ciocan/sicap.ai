import { mastra } from "@/agent";
import { HTTPException } from "hono/http-exception";

// Get Mastra agent instance
export const getAgent = () => {
  const agent = mastra.getAgent("sicapAgent");
  if (!agent) {
    throw new HTTPException(500, { message: "Agent not found" });
  }
  return agent;
};

// Get agent memory
export const getAgentMemory = async () => {
  const agent = getAgent();

  if (!agent.hasOwnMemory()) {
    throw new HTTPException(400, { message: "Agent does not have memory" });
  }

  const memory = await agent.getMemory();
  if (!memory) {
    throw new HTTPException(404, { message: "Memory not found" });
  }

  return memory;
};

// Validate thread ownership
export const validateThreadOwnership = async (threadId: string, userId: string) => {
  const memory = await getAgentMemory();

  try {
    const thread = await memory.getThreadById({ threadId });

    if (!thread) {
      throw new HTTPException(404, { message: "Thread not found" });
    }

    if (thread.resourceId !== userId) {
      throw new HTTPException(403, { message: "Thread does not belong to user" });
    }

    return thread;
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: "Failed to get thread" });
  }
};
