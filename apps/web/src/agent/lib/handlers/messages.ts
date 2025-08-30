import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { getAgentMemory } from "@/agent/lib/utils";
import type {
  SuccessResponse,
  VoteMessageRequestSchema,
  JsonInputSchema,
  Env,
} from "@/agent/lib/schemas";
import { mastra } from "@/agent";

// POST /agent/messages/:messageId/vote
export function voteMessageHandler<
  E extends Env,
  P extends string,
  I extends JsonInputSchema<typeof VoteMessageRequestSchema>,
>() {
  return async (c: Context<E, P, I>) => {
    const validated = c.req.valid("json");
    const userId = c.get("userId");
    const messageId = c.req.param("messageId");

    const { threadId, vote, branchIndex } = validated;

    if (!messageId) {
      throw new HTTPException(400, { message: "Message ID is required" });
    }

    const memory = await getAgentMemory();

    try {
      const { uiMessages } = await memory.query({
        resourceId: userId,
        threadId,
        selectBy: {
          include: [{ id: messageId }],
        },
      });

      if (!uiMessages) {
        throw new HTTPException(404, { message: "Message not found in memory" });
      }

      const message = uiMessages.find((msg) => msg.id === messageId);

      if (!message) {
        throw new HTTPException(404, { message: "Message not found in list" });
      }

      const storage = mastra.getStorage();

      if (!storage) {
        throw new HTTPException(404, { message: "Storage not found" });
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

      const response: SuccessResponse & { message: any } = {
        success: true,
        message: updatedMessage,
      };
      return c.json(response);
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Failed to vote on message:", error);
      throw new HTTPException(500, { message: "Failed to vote on message" });
    }
  };
}
