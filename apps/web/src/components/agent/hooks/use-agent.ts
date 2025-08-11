import { useExternalStoreRuntime } from "@assistant-ui/react";
import { useEffect, useRef, useState } from "react";
import { DefaultChatTransport, type UIMessage } from "ai";
import type { MastraMessageV2 } from "@mastra/core/memory";
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
import { useThreadContext, useThreadList } from "./thread-context";
import { env } from "@/lib/env";

export function useAgentRuntime() {
  const { agentId, resourceId, threadId, ensureThreadId } = useThreadContext();
  const mastraClient = useMastraClient();
  const threadList = useThreadList();
  const isCreatingNewThreadRef = useRef(false);
  const redirectedThreadsRef = useRef(new Set<string>());
  const [invalidThreadId, setInvalidThreadId] = useState<string | null>(null);

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: `${env.NEXT_PUBLIC_AGENT_API_URL}/api/agents/${agentId}/stream`,
    }),
  });

  // load messages from memory on mount and only when threadId changes
  useEffect(() => {
    if (!threadId) {
      // Clear messages when no thread is selected
      chat.setMessages([]);
      // Clear the redirected threads set and invalid thread state when switching to no thread
      redirectedThreadsRef.current.clear();
      setInvalidThreadId(null);
      return;
    }

    // Skip loading messages if we're in the middle of creating a new thread
    // This prevents race condition where the first message gets duplicated
    if (isCreatingNewThreadRef.current) {
      isCreatingNewThreadRef.current = false;
      return;
    }

    let cancelled = false;
    const loadMessages = async () => {
      try {
        const thread = mastraClient.getMemoryThread(threadId, agentId);
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
        // Clear redirected threads set and invalid thread state on successful load
        redirectedThreadsRef.current.clear();
        setInvalidThreadId(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        // Check if this is a thread not found error (404 or similar)
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStatus = (error as { status?: number })?.status;

        const isThreadNotFound =
          error instanceof Error &&
          (errorMessage.includes("404") ||
            errorMessage.includes("Not Found") ||
            errorMessage.includes("not found") ||
            errorStatus === 404);

        if (isThreadNotFound) {
          // Mark this thread as invalid for separate handling
          setInvalidThreadId(threadId);
          return;
        }

        // For other errors, silently continue (could be temporary network issues)
      }
    };
    void loadMessages();
    return () => {
      cancelled = true;
    };
  }, [threadId, agentId, mastraClient, chat.setMessages]);

  // Separate effect to handle invalid thread redirects
  useEffect(() => {
    if (invalidThreadId && !redirectedThreadsRef.current.has(invalidThreadId)) {
      redirectedThreadsRef.current.add(invalidThreadId);
      // Clear the invalid thread state and redirect
      setInvalidThreadId(null);
      if (threadList.onSwitchToNewThread) {
        threadList.onSwitchToNewThread();
      }
    }
  }, [invalidThreadId, threadList]);

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
        const wasNewThread = !threadId; // Check if we're creating a new thread
        const ensuredThreadId = await ensureThreadId();

        // If this was a new thread creation, set the flag to prevent message loading race condition
        if (wasNewThread) {
          isCreatingNewThreadRef.current = true;
        }

        const mastraMessage = buildMastraMessageFromAppendMessage({
          message,
          threadId: ensuredThreadId,
          resourceId,
        });
        await mastraClient.saveMessageToMemory({
          agentId,
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
          agentId,
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
          agentId,
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
  }, [chat.messages, chat.status, ensureThreadId, mastraClient, agentId, resourceId]);

  return { runtime };
}
