import { useExternalStoreRuntime } from "@assistant-ui/react";
import { useEffect, useRef, useMemo } from "react";
import { DefaultChatTransport, type UIMessage } from "ai";
import type { MastraMessageV2 } from "@mastra/core/memory";
import type { AppendMessage } from "@assistant-ui/react";
import { useChat } from "@ai-sdk/react";

import { toast } from "@sicap/ui";

import { AISDKMessageConverter } from "@/components/agent/utils/convert-message";
import { toCreateMessage } from "@/components/agent/utils/to-create-message";
import { sliceMessagesUntil } from "@/components/agent/utils/slice-messages";
import { getVercelAIMessages } from "@/components/agent/utils/get-vercel-messages";
import {
  buildMastraMessageFromAppendMessage,
  buildMastraMessageFromUIMessage,
} from "@/components/agent/utils/runtime";
import { useIsCreatingNewThread, useSetIsCreatingNewThread } from "@/components/agent/stores";
import { useThreadContext, useThreadList } from "./thread-context";
import { getSessionId } from "@/utils/session";
import { useIdentify } from "@/hooks";
import { env } from "@/lib/env";

export function useAgentRuntime() {
  const { agentId, resourceId, threadId, ensureThreadId, refetchThreads, mastraClient } =
    useThreadContext();
  const threadList = useThreadList();
  const redirectedThreadsRef = useRef(new Set<string>());
  const threadsCreatedInSessionRef = useRef(new Set<string>());
  const { isAuthenticated } = useIdentify();

  // Use Zustand store for thread state
  const isCreatingNewThread = useIsCreatingNewThread();
  const setIsCreatingNewThread = useSetIsCreatingNewThread();

  // Generate a stable sessionId for this browser session
  const sessionId = useMemo(() => getSessionId(threadId), [threadId]);

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: `${env.NEXT_PUBLIC_AGENT_API_URL}/api/agents/${agentId}/stream`,
      headers: {
        "x-session-id": sessionId,
      },
      credentials: "include",
    });
  }, [agentId, sessionId]);

  const chat = useChat({ transport });

  // Load messages when threadId changes
  useEffect(() => {
    // Stop any ongoing streaming when switching threads
    if (chat.status === "streaming" || chat.status === "submitted") {
      chat.stop();
    }

    if (!threadId) {
      chat.setMessages([]);
      redirectedThreadsRef.current.clear();
      threadsCreatedInSessionRef.current.clear();
      return;
    }

    // Skip loading if creating a new thread to prevent race conditions
    if (isCreatingNewThread) {
      return;
    }

    // Skip loading messages for threads created in this session - chat already has correct state
    if (threadsCreatedInSessionRef.current.has(threadId)) {
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

        // Clear error states on successful load
        redirectedThreadsRef.current.clear();
      } catch (error) {
        if (cancelled) {
          return;
        }

        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStatus = (error as { status?: number })?.status;

        const isThreadNotFound =
          errorMessage.includes("404") ||
          errorMessage.includes("Not Found") ||
          errorMessage.includes("not found") ||
          errorStatus === 404;

        if (isThreadNotFound) {
          // Thread doesn't exist, redirect to new thread
          if (threadList.onSwitchToNewThread) {
            threadList.onSwitchToNewThread();
          }
        }
        // For other errors, silently continue (could be temporary network issues)
      }
    };

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [threadId, agentId, mastraClient]);

  const messages = AISDKMessageConverter.useThreadMessages({
    isRunning: chat.status === "submitted" || chat.status === "streaming",
    messages: chat.messages,
  });

  const runtime = useExternalStoreRuntime({
    isRunning: chat.status === "submitted" || chat.status === "streaming",
    messages,
    setMessages: (messages) => chat.setMessages(messages.flatMap(getVercelAIMessages)),
    onCancel: async () => chat.stop(),
    onNew: async (message: AppendMessage) => {
      if (!isAuthenticated || !resourceId) {
        toast.warning("Atenție!", {
          description: "Trebuie să te autentifici pentru a folosi agentul.",
        });
        return;
      }

      const wasNewThread = !threadId;
      if (wasNewThread) {
        setIsCreatingNewThread(true);
      }

      const ensuredThreadId = await ensureThreadId();

      // Track that this thread was created in this session
      if (wasNewThread) {
        threadsCreatedInSessionRef.current.add(ensuredThreadId);
      }

      try {
        const mastraMessage = buildMastraMessageFromAppendMessage({
          message,
          threadId: ensuredThreadId,
          resourceId,
        });

        await mastraClient.saveMessageToMemory({
          agentId,
          messages: [mastraMessage] as unknown as MastraMessageV2[],
        });

        // Generate title for new threads
        if (messages.length === 0) {
          void mastraClient
            .request("/gen-title", {
              method: "POST",
              body: { threadId: ensuredThreadId },
            })
            .then(refetchThreads)
            .catch((error) => {
              console.error("Error generating title", error);
            });
        }
      } catch (error) {
        console.error("Error persisting user message", error);
      }

      await chat.sendMessage(await toCreateMessage(message), {
        headers: {
          "x-session-id": ensuredThreadId,
        },
      });
    },
    onEdit: async (message: AppendMessage) => {
      if (!isAuthenticated || !resourceId) {
        toast.warning("Atenție!", {
          description: "Trebuie să te autentifici pentru a folosi agentul.",
        });
        return;
      }

      const newMessages = sliceMessagesUntil(chat.messages, message.parentId);
      chat.setMessages(newMessages);

      try {
        const ensuredThreadId = await ensureThreadId();
        const mastraMessage = buildMastraMessageFromAppendMessage({
          message,
          threadId: ensuredThreadId,
          resourceId,
        });

        await mastraClient.saveMessageToMemory({
          agentId,
          messages: [mastraMessage] as unknown as MastraMessageV2[],
        });
      } catch (error) {
        console.error("Error persisting edited message", error);
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

  // Persist assistant messages after streaming completes
  const lastSavedAssistantIdRef = useRef<string | null>(null);

  useEffect(() => {
    const isRunning = chat.status === "submitted" || chat.status === "streaming";

    if (isRunning) {
      return;
    }

    // Reset new thread flag when streaming completes
    if (isCreatingNewThread) {
      setIsCreatingNewThread(false);
    }

    const lastAssistant = [...chat.messages].reverse().find((m) => m.role === "assistant");

    if (!lastAssistant || lastAssistant.id === lastSavedAssistantIdRef.current) {
      return;
    }

    if (!resourceId || !isAuthenticated) {
      return;
    }

    const persist = async () => {
      try {
        const ensuredThreadId = await ensureThreadId();
        const assistantMastraMessage = buildMastraMessageFromUIMessage({
          message: lastAssistant,
          threadId: ensuredThreadId,
          resourceId,
        });

        await mastraClient.saveMessageToMemory({
          agentId,
          messages: [assistantMastraMessage] as unknown as MastraMessageV2[],
        });

        lastSavedAssistantIdRef.current = lastAssistant.id;
      } catch (error) {
        console.error("Error persisting assistant message", error);
      }
    };

    void persist();
  }, [
    chat.status,
    chat.messages,
    ensureThreadId,
    mastraClient,
    agentId,
    resourceId,
    isAuthenticated,
  ]);

  return { runtime };
}
