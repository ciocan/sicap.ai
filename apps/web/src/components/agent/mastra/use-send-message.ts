import { useCallback, useEffect, useState } from "react";
import type { CoreAssistantMessage, CoreMessage, ToolCallPart, ToolResultPart } from "ai";
import type { MessageStatus, AppendMessage } from "@assistant-ui/react";

import { appendMessageToCoreMessage, coreMessagesToModifiedCoreMessages } from "./converters";
import { useMastraClient } from "./use-mastra-client";
import {
  handleOnTextPart,
  handleOnToolCallPart,
  handleOnToolResultPart,
} from "./stream-processors";

interface UseSendMessageArgs {
  config: {
    agentId: string;
    resourceId: string;
    threadId: string;
  };
}

export type ModifiedAssistantContent =
  | string
  | (
      | Extract<
          Extract<CoreAssistantMessage["content"], unknown[]>[number],
          { type: "text" | "reasoning" | "redacted-reasoning" | "file" }
        >
      | (Omit<ToolCallPart & Omit<ToolResultPart, "type">, "result"> &
          Partial<Pick<ToolResultPart, "result">>)
    )[];

type ModifiedCoreAssistantMessage = Omit<Extract<CoreMessage, { role: "assistant" }>, "content"> & {
  content: ModifiedAssistantContent;
};
export type ModifiedCoreMessage = (
  | Extract<CoreMessage, { role: "user" | "system" | "tool" }>
  | ModifiedCoreAssistantMessage
) & { status?: MessageStatus };

export const useSendMessage = (args: UseSendMessageArgs) => {
  const [messages, setMessages] = useState<ModifiedCoreMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const client = useMastraClient();
  const agent = client.getAgent(args.config.agentId);

  const fetchMessages = useCallback(async () => {
    try {
      const messages = await client
        .getMemoryThread(args.config.threadId, args.config.agentId)
        .getMessages();
      setMessages(coreMessagesToModifiedCoreMessages(messages.messages));
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Thread not found")) {
          await client.createMemoryThread({
            threadId: args.config.threadId,
            title: "",
            resourceId: args.config.resourceId,
            metadata: {},
            agentId: args.config.agentId,
          });

          fetchMessages();
        }
      }
    }
  }, [client, args.config.agentId, args.config.threadId, args.config.resourceId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = useCallback(
    async (message: AppendMessage) => {
      const userMessage = appendMessageToCoreMessage(message);

      setMessages((prev) => [...prev, userMessage]);

      setIsRunning(true);
      setIsDisabled(true);
      const stream = await agent.stream({
        messages: [userMessage],
        resourceId: args.config.resourceId,
        threadId: args.config.threadId,
      });

      stream.processDataStream({
        onDataPart(streamPart) {
          console.warn("onDataPart not implemented", streamPart);
        },
        onErrorPart(streamPart) {
          console.warn("onErrorPart not implemented", streamPart);
        },
        onFilePart(streamPart) {
          console.warn("onFilePart not implemented", streamPart);
        },
        onFinishMessagePart(streamPart) {
          // @ts-expect-error: TODO: fix this
          setMessages((prev) => [
            ...prev.slice(0, -1),
            {
              ...prev[prev.length - 1],
              status: {
                type: "complete",
                reason: streamPart.finishReason === "stop" ? "stop" : "unknown",
              },
            },
          ]);
          setIsRunning(false);
          setIsDisabled(false);
        },
        onFinishStepPart(streamPart) {
          console.warn("onFinishStepPart not implemented", streamPart);
        },
        onMessageAnnotationsPart(streamPart) {
          console.warn("onMessageAnnotationsPart not implemented", streamPart);
        },
        onReasoningPart(streamPart) {
          console.warn("onReasoningPart not implemented", streamPart);
        },
        onReasoningSignaturePart(streamPart) {
          console.warn("onReasoningSignaturePart not implemented", streamPart);
        },
        onRedactedReasoningPart(streamPart) {
          console.warn("onRedactedReasoningPart not implemented", streamPart);
        },
        onSourcePart(streamPart) {
          console.warn("onSourcePart not implemented", streamPart);
        },
        onStartStepPart(streamPart) {
          console.warn("onStartStepPart not implemented", streamPart);
        },
        onTextPart(text) {
          setMessages((messages) => handleOnTextPart(text, messages));
        },
        onToolCallDeltaPart(streamPart) {
          console.warn("onToolCallDeltaPart not implemented", streamPart);
        },
        onToolCallPart(toolCall) {
          setMessages((messages) => handleOnToolCallPart(toolCall, messages));
        },
        onToolCallStreamingStartPart(streamPart) {
          console.warn("onToolCallStreamingStartPart not implemented", streamPart);
        },
        onToolResultPart(toolResult) {
          setMessages((messages) => handleOnToolResultPart(toolResult, messages));
        },
      });
    },
    [agent.stream, args.config.resourceId, args.config.threadId],
  );

  return {
    messages,
    setMessages,
    sendMessage,
    isRunning,
    isDisabled,
  };
};
