import { useExternalStoreRuntime } from "@assistant-ui/react";
import { useEffect, useMemo, useRef } from "react";
import { DefaultChatTransport, type UIMessage } from "ai";
import type { MastraMessageV2 } from "@mastra/core/memory";
import type { AppendMessage } from "@assistant-ui/react";
import { useChat } from "@ai-sdk/react";
import { useQueryState, parseAsString } from "nuqs";

import { AISDKMessageConverter } from "@/components/agent/utils/convert-message";
import { toCreateMessage } from "@/components/agent/utils/to-create-message";
import { sliceMessagesUntil } from "@/components/agent/utils/slice-messages";
import { getVercelAIMessages } from "@/components/agent/utils/get-vercel-messages";
import {
  buildMastraMessageFromAppendMessage,
  buildMastraMessageFromUIMessage,
} from "@/components/agent/utils/runtime";
import { useMastraClient } from "./use-mastra-client";
import { useThreadList } from "./use-thread-list";
import { generateId } from "@/utils";
import { env } from "@/lib/env";

const AGENT_ID = "sicapAgent" as const;
const resourceId = "anon-ae576d00-963f-4b0d-8abe-27b4ccab1229"; // TODO: replace with userId

export function useAgentRuntime() {
  const [threadId, setThreadId] = useQueryState("t", parseAsString);
  const mastraClient = useMastraClient();

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: `${env.NEXT_PUBLIC_AGENT_API_URL}/api/agents/sicapAgent/stream`,
    }),
  });

  // load messages from memory on mount and only when threadId changes
  useEffect(() => {
    if (!threadId) {
      // Clear messages when no thread is selected
      chat.setMessages([]);
      return;
    }
    let cancelled = false;
    const loadMessages = async () => {
      try {
        const thread = mastraClient.getMemoryThread(threadId, AGENT_ID);
        const { uiMessages } = await thread.getMessages();
        if (cancelled) {
          return;
        }
        chat.setMessages(uiMessages as UIMessage[]);
        // Track the last assistant message id from loaded history to prevent re-saving
        const lastAssistant = [...(uiMessages as UIMessage[])]
          .reverse()
          .find((m) => m.role === "assistant");
        lastSavedAssistantIdRef.current = lastAssistant?.id ?? null;
      } catch {
        // Thread may not exist yet; ignore transient errors during initialization
      }
    };
    void loadMessages();
    return () => {
      cancelled = true;
    };
  }, [threadId, mastraClient, chat.setMessages]);

  // Do not auto-select or auto-create a thread when URL has no `t`.
  // Sidebar/thread list remains unselected until user acts.

  const safeThreadId = threadId;

  const threadList = useThreadList({
    agentId: AGENT_ID,
    threadId: safeThreadId,
    resourceId,
    setThreadId: (id: string | null) => {
      setThreadId(id);
    },
  });

  // Ensure a thread id synchronously before persisting messages
  const ensureThreadId = useMemo(() => {
    return async (): Promise<string> => {
      if (threadId) {
        // Ensure the thread exists on the server for the current id
        try {
          const thread = mastraClient.getMemoryThread(threadId, AGENT_ID);
          await thread.get();
          return threadId;
        } catch {
          await mastraClient.createMemoryThread({
            agentId: AGENT_ID,
            resourceId,
            metadata: {},
            threadId,
          });
          return threadId;
        }
      }
      // No thread selected: create a new one lazily on first message
      const newId = generateId();
      await mastraClient.createMemoryThread({
        agentId: AGENT_ID,
        resourceId,
        metadata: {},
        threadId: newId,
      });
      setThreadId(newId);
      return newId;
    };
  }, [mastraClient, threadId, setThreadId]);

  const messages = AISDKMessageConverter.useThreadMessages({
    isRunning: chat.status === "submitted" || chat.status === "streaming",
    messages: chat.messages,
  });

  // RUNTIME
  const runtime = useExternalStoreRuntime({
    isRunning: chat.status === "submitted" || chat.status === "streaming",
    messages,
    setMessages: (messages) => chat.setMessages(messages.flatMap(getVercelAIMessages)),
    onCancel: async () => chat.stop(),
    onNew: async (message: AppendMessage) => {
      // Persist the user message to Mastra memory
      try {
        const ensuredThreadId = await ensureThreadId();
        const mastraMessage = buildMastraMessageFromAppendMessage({
          message,
          threadId: ensuredThreadId,
          resourceId,
        });
        await mastraClient.saveMessageToMemory({
          agentId: AGENT_ID,
          messages: [mastraMessage] as unknown as MastraMessageV2[], // TODO: fix this, its temporary until we have a v3 api (ai-v5 sdk)
        });
      } catch (error) {
        console.error("---onNew--- Error persisting user message", error);
      }
      await chat.sendMessage(await toCreateMessage(message));
    },
    onEdit: async (message: AppendMessage) => {
      const newMessages = sliceMessagesUntil(chat.messages, message.parentId);
      chat.setMessages(newMessages);
      // Persist the edited user message to Mastra memory
      try {
        const ensuredThreadId = await ensureThreadId();
        const mastraMessage = buildMastraMessageFromAppendMessage({
          message,
          threadId: ensuredThreadId,
          resourceId,
        });
        await mastraClient.saveMessageToMemory({
          agentId: AGENT_ID,
          messages: [mastraMessage] as unknown as MastraMessageV2[], // TODO: fix this, its temporary until we have a v3 api (ai-v5 sdk)
        });
      } catch (error) {
        console.error("---onEdit--- Error persisting edited message", error);
      }
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
    adapters: { threadList },
  });

  // Persist the assistant's latest message after streaming completes
  const lastSavedAssistantIdRef = useRef<string | null>(null);
  useEffect(() => {
    const isRunning = chat.status === "submitted" || chat.status === "streaming";
    if (isRunning) {
      return;
    }
    const lastAssistant = [...chat.messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) {
      return;
    }
    if (lastAssistant.id === lastSavedAssistantIdRef.current) {
      return;
    }

    const persist = async () => {
      try {
        const ensuredThreadId = await ensureThreadId();
        const mastraMessage = buildMastraMessageFromUIMessage({
          message: lastAssistant,
          threadId: ensuredThreadId,
          resourceId,
        });
        await mastraClient.saveMessageToMemory({
          agentId: AGENT_ID,
          messages: [mastraMessage] as unknown as MastraMessageV2[], // TODO: fix this, its temporary until we have a v3 api (ai-v5 sdk)
        });
        lastSavedAssistantIdRef.current = lastAssistant.id;
      } catch (error) {
        console.error(
          "---useEffect:lastSavedAssistant--- Error persisting assistant message",
          error,
        );
      }
    };
    void persist();
  }, [chat.messages, chat.status, ensureThreadId, mastraClient]);

  return { runtime };
}
