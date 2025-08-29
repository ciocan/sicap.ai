import type { AppendMessage } from "@assistant-ui/react";
import type { MastraMessageV3 } from "@mastra/core/agent/message-list";
import type { UIMessage } from "ai";

import { generateId } from "@/utils";

export function buildMastraMessageFromAppendMessage({
  message,
  threadId,
  resourceId,
}: {
  message: AppendMessage;
  threadId: string;
  resourceId: string;
}): MastraMessageV3 {
  const text = message.content
    .filter((part) => part.type === "text")
    .map((p) => p.text)
    .join("\n\n");

  return {
    id: generateId(),
    role: message.role as MastraMessageV3["role"],
    createdAt: new Date(),
    threadId,
    resourceId,
    content: {
      format: 3,
      parts: text
        ? [
            {
              type: "text",
              text,
            },
          ]
        : [],
    },
  } satisfies MastraMessageV3;
}

function isTextUIPart(part: unknown): part is { type: "text"; text: string } {
  if (typeof part !== "object" || part === null) {
    return false;
  }
  const candidate = part as Record<string, unknown>;
  return candidate.type === "text" && typeof candidate.text === "string";
}

export function buildMastraMessageFromUIMessage({
  message,
  threadId,
  resourceId,
}: {
  message: UIMessage;
  threadId: string;
  resourceId: string;
}): MastraMessageV3 {
  const parts = (message.parts ?? []).filter(isTextUIPart);
  const text = parts.map((p) => p.text).join("\n\n");

  return {
    id: message.id,
    role: message.role as MastraMessageV3["role"],
    createdAt: new Date(),
    threadId,
    resourceId,
    content: {
      format: 3,
      parts: text
        ? [
            {
              type: "text",
              text,
            },
          ]
        : [],
    },
  } satisfies MastraMessageV3;
}
