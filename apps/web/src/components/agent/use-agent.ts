import { useExternalStoreRuntime } from "@assistant-ui/react";
import { MastraClient } from "@mastra/client-js";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { MastraMessageV2 } from "@mastra/core/memory";

import { AISDKMessageConverter } from "./utils/convert-message";
import { toCreateMessage } from "./utils/to-create-message";
import { sliceMessagesUntil } from "./utils/slice-messages";
import { getVercelAIMessages } from "./utils/get-vercel-messages";
import { env } from "@/lib/env";
import { generateId } from "@/utils";

export const mastraClient = new MastraClient({
  baseUrl: env.NEXT_PUBLIC_AGENT_API_URL,
});

export function useAgent() {
  const agent = mastraClient.getAgent("sicapAgent");

  const createThread = async () => {
    const thread = await mastraClient.createMemoryThread({
      resourceId: "123", // TODO: replace with user id
      agentId: "sicapAgent",
    });

    return thread;
  };

  const addMessage = async (message: MastraMessageV2) => {
    const savedMessages = await mastraClient.saveMessageToMemory({
      messages: [message],
      agentId: "sicapAgent",
    });

    return savedMessages;
  };

  return {
    agent,
    createThread,
    addMessage,
  };
}

export function useAgentRuntime() {
  const chat = useChat({
    transport: new DefaultChatTransport({
      api: `${env.NEXT_PUBLIC_AGENT_API_URL}/api/agents/sicapAgent/stream`,
    }),
  });

  const messages = AISDKMessageConverter.useThreadMessages({
    isRunning: chat.status === "submitted" || chat.status === "streaming",
    messages: chat.messages,
  });

  const runtime = useExternalStoreRuntime({
    isRunning: chat.status === "submitted" || chat.status === "streaming",
    messages,
    setMessages: (messages) => chat.setMessages(messages.flatMap(getVercelAIMessages)),
    onCancel: async () => chat.stop(),
    onNew: async (message) => {
      await chat.sendMessage(await toCreateMessage(message));
    },
    onEdit: async (message) => {
      const newMessages = sliceMessagesUntil(chat.messages, message.parentId);
      chat.setMessages(newMessages);

      await chat.sendMessage(await toCreateMessage(message));
    },
    onReload: async (parentId: string | null) => {
      const newMessages = sliceMessagesUntil(chat.messages, parentId);
      chat.setMessages(newMessages);

      await chat.regenerate();
    },
    onAddToolResult: ({ toolCallId, result }) => {
      chat.addToolResult({
        tool: toolCallId,
        toolCallId,
        output: result,
      });
    },
    adapters: {},
  });

  return { runtime };
}
