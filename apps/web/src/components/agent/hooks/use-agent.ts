import { useExternalStoreRuntime } from "@assistant-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DefaultChatTransport, type UIMessage } from "ai";
import type { MastraMessageV2, MastraMessageV3 } from "@mastra/core/memory";
import type { AppendMessage } from "@assistant-ui/react";
import { useChat } from "@ai-sdk/react";

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

export function useAgentRuntime() {
  const chat = useChat({
    transport: new DefaultChatTransport({
      api: `${env.NEXT_PUBLIC_AGENT_API_URL}/api/agents/sicapAgent/stream`,
    }),
  });
  const mastraClient = useMastraClient();

  // TODO: replace with user id
  const resourceId = useMemo(() => {
    if (typeof window === "undefined") {
      return `anon-${generateId()}`;
    } else {
      const existing = window.localStorage.getItem("sicap:resourceId");
      if (existing) {
        return existing;
      }
      const created = `anon-${generateId()}`;
      window.localStorage.setItem("sicap:resourceId", created);
      return created;
    }
  }, []);

  // TODO: replace with thread id from url
  const [threadId, setThreadId] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return window.localStorage.getItem("sicap:threadId") ?? "";
  });

  // Persist thread id
  useEffect(() => {
    if (typeof window !== "undefined" && threadId) {
      window.localStorage.setItem("sicap:threadId", threadId);
    }
  }, [threadId]);
  //

  // load messages from memory on mount and only when threadId changes
  useEffect(() => {
    const loadMessages = async () => {
      const thread = mastraClient.getMemoryThread(threadId, AGENT_ID);
      const { uiMessages } = await thread.getMessages();
      chat.setMessages(uiMessages as UIMessage[]);
    };
    void loadMessages();
  }, [threadId]);

  // Ensure a Mastra memory thread exists for this resource
  useEffect(() => {
    let cancelled = false;
    const ensureThread = async () => {
      try {
        if (threadId) {
          return; // Already set
        }
        const threads = await mastraClient.getMemoryThreads({ agentId: AGENT_ID, resourceId });
        if (cancelled) {
          return;
        }
        if (threads.length > 0) {
          setThreadId(threads[0]!.id);
          return;
        }

        const newThreadId = generateId();
        setThreadId(newThreadId);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("sicap:threadId", newThreadId);
        }
        await mastraClient.createMemoryThread({
          agentId: AGENT_ID,
          resourceId,
          metadata: {},
          threadId: newThreadId,
        });
        if (cancelled) {
          return;
        }
      } catch {
        // Swallow in UI hook; logging could be added via an observability layer
      }
    };
    void ensureThread();
    return () => {
      cancelled = true;
    };
  }, [mastraClient, resourceId, threadId]);

  const safeThreadId = threadId;

  const threadList = useThreadList({
    agentId: AGENT_ID,
    threadId: safeThreadId,
    resourceId,
    setThreadId: (id: string) => {
      setThreadId(id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("sicap:threadId", id);
      }
    },
  });

  // Ensure a thread id synchronously before persisting messages
  const ensureThreadId = useMemo(() => {
    return async (): Promise<string> => {
      if (threadId) {
        return threadId;
      }
      // Try to fetch an existing thread
      const threads = await mastraClient.getMemoryThreads({ agentId: AGENT_ID, resourceId });
      if (threads.length > 0) {
        const existingId = threads[0]!.id;
        setThreadId(existingId);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("sicap:threadId", existingId);
        }
        return existingId;
      }
      // Create a new one
      const newId = generateId();
      setThreadId(newId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("sicap:threadId", newId);
      }
      await mastraClient.createMemoryThread({
        agentId: AGENT_ID,
        resourceId,
        metadata: {},
        threadId: newId,
      });
      return newId;
    };
  }, [mastraClient, resourceId, threadId]);

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
  }, [chat.messages, chat.status, ensureThreadId, mastraClient, resourceId]);

  return { runtime };
}
