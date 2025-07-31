import type {
  AppendMessage,
  FileContentPart,
  ImageContentPart,
  ReasoningContentPart,
  TextContentPart,
  ThreadMessageLike,
} from "@assistant-ui/react";
import type {
  CoreAssistantMessage,
  CoreMessage,
  CoreSystemMessage,
  CoreUserMessage,
  FilePart,
  ImagePart,
  TextPart,
  ToolCallPart,
} from "ai";
import type { ModifiedCoreMessage } from "./use-send-message";

export type ReadonlyJSONValue =
  | null
  | string
  | number
  | boolean
  | ReadonlyJSONObject
  | ReadonlyJSONArray;

export type ReadonlyJSONObject = {
  readonly [key: string]: ReadonlyJSONValue;
};

export type ReadonlyJSONArray = readonly ReadonlyJSONValue[];

type AppendMessagePartsToCoreMessagePartsResult = Extract<
  CoreMessage["content"],
  unknown[]
>[number][];

const appendMessagePartsToCoreMessageParts = (
  parts: AppendMessage["content"],
): AppendMessagePartsToCoreMessagePartsResult => {
  return parts.map((part) => {
    switch (part.type) {
      case "text":
        return { type: part.type, text: part.text } satisfies TextPart;
      case "image":
        return { type: part.type, image: part.image } satisfies ImagePart;
      case "file":
        return {
          type: part.type,
          mimeType: part.mimeType,
          data: part.data,
        } satisfies FilePart;
      case "reasoning":
        return { type: part.type, text: part.text };
      case "tool-call":
        return {
          type: "tool-call",
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          args: part.args,
        } satisfies ToolCallPart;
      default:
        throw new Error(`Unsupported part type: ${part.type}`);
    }
  });
};

export const appendMessageToCoreMessage = (message: AppendMessage): ModifiedCoreMessage => {
  switch (message.role) {
    case "system": {
      const content = message.content
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("\n");

      const systemMessage: CoreSystemMessage = {
        role: "system",
        content,
      };

      return systemMessage;
    }
    case "user": {
      return {
        role: "user",
        content: appendMessagePartsToCoreMessageParts(message.content),
      } as CoreUserMessage;
    }
    case "assistant":
      return {
        role: "assistant",
        content: appendMessagePartsToCoreMessageParts(message.content),
      } as CoreAssistantMessage;
  }
};

const coreMessagePartsToThreadMessageLikeParts = (
  parts: ModifiedCoreMessage["content"],
): ThreadMessageLike["content"] => {
  if (typeof parts === "string") {
    return [{ type: "text", text: parts }];
  }

  return parts.map((part) => {
    switch (part.type) {
      case "reasoning":
        return {
          type: "reasoning",
          text: part.text,
        } satisfies ReasoningContentPart;
      case "image":
        return {
          type: part.type,
          image: part.image.toString(),
        } satisfies ImageContentPart;
      case "text":
        return {
          type: part.type,
          text: part.text,
        } satisfies TextContentPart;
      case "file":
        return {
          type: part.type,
          data: part.data.toString(),
          mimeType: part.mimeType,
        } satisfies FileContentPart;
      case "redacted-reasoning":
        return {
          type: "reasoning",
          text: part.data,
        } satisfies ReasoningContentPart;
      case "tool-call": {
        return {
          ...part,
          args: part.args as ReadonlyJSONObject,
        };
      }
      case "tool-result": {
        throw new Error("tool-result case shouldn't happen");
      }
    }
  });
};

export const coreMessageToThreadMessageLike = (message: ModifiedCoreMessage): ThreadMessageLike => {
  switch (message.role) {
    case "system":
      return {
        role: "system",
        content: coreMessagePartsToThreadMessageLikeParts(message.content),
      };
    case "user":
      return {
        role: "user",
        content: coreMessagePartsToThreadMessageLikeParts(message.content),
      };
    case "assistant":
      return {
        role: "assistant",
        content: coreMessagePartsToThreadMessageLikeParts(message.content),
        status: message.status,
      };
    case "tool":
      throw new Error("tool case shouldn't happen after conversion");
  }
};

export const coreMessagesToModifiedCoreMessages = (
  messages: CoreMessage[],
): ModifiedCoreMessage[] => {
  const toolCallsMap = new Map<
    string,
    { toolCall: ToolCallPart; partIndex: number; messageIndex: number }
  >();
  const modifiedCoreMessages: ModifiedCoreMessage[] = [];

  for (const message of messages) {
    if (message.role !== "assistant" && message.role !== "tool") {
      modifiedCoreMessages.push(message);
      continue;
    }

    if (message.role === "assistant") {
      if (typeof message.content === "string") {
        const updatedPart = {
          type: "text" as const,
          text: message.content,
        };

        modifiedCoreMessages.push({
          ...message,
          content: [updatedPart],
        });

        continue;
      }

      modifiedCoreMessages.push(message);

      for (const part of message.content) {
        if (part.type === "tool-call") {
          toolCallsMap.set(part.toolCallId, {
            toolCall: part,
            partIndex: message.content.indexOf(part),
            messageIndex: modifiedCoreMessages.length - 1,
          });
        }
      }
    }

    if (message.role === "tool") {
      for (const part of message.content) {
        const toolDetails = toolCallsMap.get(part.toolCallId);

        if (!toolDetails) {
          continue;
        }

        const updatedToolCall = {
          ...toolDetails.toolCall,
          argsText: JSON.stringify(toolDetails.toolCall.args),
          result: part.result,
          isError: part.isError,
        };

        const assistantMessage = modifiedCoreMessages[toolDetails.messageIndex];

        if (
          assistantMessage?.role !== "assistant" ||
          typeof assistantMessage?.content === "string"
        ) {
          continue;
        }

        assistantMessage.content.splice(toolDetails.partIndex, 1, updatedToolCall);

        toolCallsMap.delete(part.toolCallId);
      }
    }
  }

  return modifiedCoreMessages;
};
