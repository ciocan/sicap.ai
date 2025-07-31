import type { TextPart, ToolCall, ToolResult } from "ai";
import type { ToolCallContentPart } from "@assistant-ui/react";

import type { ModifiedAssistantContent, ModifiedCoreMessage } from "./use-send-message";
import type { ReadonlyJSONObject } from "./converters";

export const handleOnTextPart = (
  text: string,
  messages: ModifiedCoreMessage[],
): ModifiedCoreMessage[] => {
  const lastMessage = messages[messages.length - 1];

  if (lastMessage && lastMessage.role === "assistant") {
    if (typeof lastMessage.content === "string") {
      const updatedContent = lastMessage.content + text;
      return [...messages.slice(0, -1), { ...lastMessage, content: updatedContent }];
    }

    const lastPart = lastMessage.content[lastMessage.content.length - 1];

    if (lastPart && lastPart.type === "text") {
      const updatedLastPart: TextPart = {
        ...lastPart,
        text: lastPart.text + text,
      };
      return [
        ...messages.slice(0, -1),
        {
          ...lastMessage,
          content: [...lastMessage.content.slice(0, -1), updatedLastPart],
        },
      ];
    }

    if (lastPart) {
      return [
        ...messages.slice(0, -1),
        {
          ...lastMessage,
          content: [...lastMessage.content, { type: "text", text }],
        },
      ];
    }

    return [
      ...messages.slice(0, -1),
      {
        ...lastMessage,
        content: [{ type: "text", text }],
      },
    ];
  }

  if (lastMessage) {
    return [
      ...messages,
      {
        role: "assistant",
        content: [{ type: "text", text }],
        status: { type: "running" },
      },
    ];
  }

  return [
    {
      role: "assistant",
      content: [{ type: "text", text }],
      status: { type: "running" },
    },
  ];
};

const createToolCallPart = (toolCall: ToolCall<string, unknown>): ToolCallContentPart => ({
  type: "tool-call",
  args: toolCall.args as ReadonlyJSONObject,
  argsText: JSON.stringify(toolCall.args),
  toolName: toolCall.toolName,
  toolCallId: toolCall.toolCallId,
});

export const handleOnToolCallPart = (
  toolCall: ToolCall<string, unknown>,
  messages: ModifiedCoreMessage[],
): ModifiedCoreMessage[] => {
  const lastMessage = messages[messages.length - 1];

  if (lastMessage && lastMessage.role === "assistant") {
    if (typeof lastMessage.content === "string") {
      const updatedTextPart: TextPart = {
        type: "text",
        text: lastMessage.content,
      };
      const newToolCallPart = createToolCallPart(toolCall);

      const updatedContent = [updatedTextPart, newToolCallPart];

      return [...messages.slice(0, -1), { ...lastMessage, content: updatedContent }];
    }

    return [
      ...messages.slice(0, -1),
      {
        ...lastMessage,
        content: [...lastMessage.content, createToolCallPart(toolCall)],
      },
    ];
  }

  return [
    {
      role: "assistant",
      content: [createToolCallPart(toolCall)],
      status: { type: "running" },
    },
  ];
};

export const handleOnToolResultPart = (
  toolResult: Omit<ToolResult<string, unknown, unknown>, "toolName" | "args">,
  messages: ModifiedCoreMessage[],
): ModifiedCoreMessage[] => {
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage) {
    return messages;
  }

  if (lastMessage.role !== "assistant") {
    return messages;
  }

  if (typeof lastMessage.content === "string") {
    return messages;
  }

  const toolCallIndex = lastMessage.content.findIndex(
    (p) => p.type === "tool-call" && p.toolCallId === toolResult.toolCallId,
  );

  if (toolCallIndex === -1) {
    return messages;
  }
  const existingToolCall = lastMessage.content[toolCallIndex];

  // type guard
  if (existingToolCall?.type !== "tool-call") {
    return messages;
  }

  const updatedToolCall = {
    ...existingToolCall,
    result: toolResult.result,
    isError: false,
  } satisfies Extract<ModifiedAssistantContent, unknown[]>[number];

  return [
    ...messages.slice(0, -1),
    {
      ...lastMessage,
      content: [
        ...lastMessage.content.slice(0, toolCallIndex),
        updatedToolCall,
        ...lastMessage.content.slice(toolCallIndex + 1),
      ],
    },
  ];
};
