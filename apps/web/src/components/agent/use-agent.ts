import {
  useAssistantRuntime,
  useThreadList,
  useThreadComposer,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { MastraClient } from "@mastra/client-js";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { MastraMessageV2 } from "@mastra/core/memory";
import type { ThreadHistoryAdapter } from "@assistant-ui/react";

import { env } from "@/lib/env";

export const mastraClient = new MastraClient({
  baseUrl: env.NEXT_PUBLIC_AGENT_API_URL,
});

export function useAgent() {
  const agent = mastraClient.getAgent("sicapAgent");
  const runtime = useAssistantRuntime();
  const threadList = useThreadList();
  const threadComposer = useThreadComposer();

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
  const historyAdapter: ThreadHistoryAdapter = {
    async load() {
      // Load messages from your storage
      const response = await fetch(`/api/thread/current`);
      const { messages } = await response.json();
      return { messages };
    },
    async append(message) {
      console.log("append", message);
    },
  };

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: `${env.NEXT_PUBLIC_AGENT_API_URL}/api/agents/sicapAgent/stream`,
    }),
  });

  const runtime = useAISDKRuntime(chat, {
    adapters: {
      threadList: {
        onSwitchToNewThread: async () => {
          // const thread = await mastraClient.createMemoryThread({
          //   resourceId: "123", // TODO: replace with user id
          //   agentId: "sicapAgent",
          // });
          console.log("onSwitchToNewThread");
        },
        onSwitchToThread: async (threadId) => {
          console.log("onSwitchToThread", threadId);
        },
        onRename: async (threadId, newTitle) => {
          console.log("onRename", threadId, newTitle);
        },
        onArchive: async (threadId) => {
          console.log("onArchive", threadId);
        },
        onDelete: async (threadId) => {
          console.log("onDelete", threadId);
        },
      },
    },
  });

  return { runtime };
}
