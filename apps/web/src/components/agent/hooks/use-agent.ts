import { useExternalStoreRuntime } from "@assistant-ui/react";
import { useEffect, useRef, useState, useMemo } from "react";
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
import { useThreadContext, useThreadList } from "./thread-context";
import { getSessionId } from "@/utils/session";
import { useIdentify } from "@/hooks";
import { env } from "@/lib/env";

export function useAgentRuntime() {
  const { agentId, resourceId, threadId, ensureThreadId, fetchThreads, mastraClient } =
    useThreadContext();
  const threadList = useThreadList();
  const isCreatingNewThreadRef = useRef(false);
  const redirectedThreadsRef = useRef(new Set<string>());
  const [invalidThreadId, setInvalidThreadId] = useState<string | null>(null);
  const { isAuthenticated } = useIdentify();

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

  // load messages from memory on mount and only when threadId changes
  useEffect(() => {
    // Stop any ongoing streaming when switching threads
    if (chat.status === "streaming" || chat.status === "submitted") {
      chat.stop();
    }

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
      return;
    }

    let cancelled = false;
    const loadMessages = async () => {
      try {
        const thread = mastraClient.getMemoryThread(threadId, agentId);

        const originalRequest = thread.request.bind(thread);
        thread.request = async (path, options) => {
          const modifiedOptions = {
            ...options,
            credentials: "include" as RequestCredentials,
          };
          return originalRequest(path, modifiedOptions);
        };

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

      const wasNewThread = !threadId; // Check if we're creating a new thread

      // If this is a new thread, set the flag BEFORE creating the thread
      // This ensures the flag is set before threadId changes
      if (wasNewThread) {
        isCreatingNewThreadRef.current = true;
      }

      // Get or create the thread ID
      const ensuredThreadId = await ensureThreadId();

      // Always persist the user message to memory
      try {
        const mastraMessage = buildMastraMessageFromAppendMessage({
          message,
          threadId: ensuredThreadId,
          resourceId,
        });
        await mastraClient.saveMessageToMemory({
          agentId,
          messages: [mastraMessage] as unknown as MastraMessageV2[], // TODO: fix this, its temporary until we have a v3 api (ai-v5 sdk)
        });

        if (messages.length === 0) {
          mastraClient
            .request("/gen-title", {
              method: "POST",
              // @ts-expect-error TODO: fix this, its temporary until mastraClient is updated with credentials
              credentials: "include" as RequestCredentials,
              body: { threadId: ensuredThreadId },
            })
            .then(fetchThreads)
            .catch((error) => {
              console.error("---useEffect:lastSavedAssistant--- Error generating title", error);
            });
        }
      } catch (error) {
        console.error("---onNew--- Error persisting user message", error);
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

  // Persist assistant messages after streaming completes
  const lastSavedAssistantIdRef = useRef<string | null>(null);
  useEffect(() => {
    const isRunning = chat.status === "submitted" || chat.status === "streaming";

    if (isRunning) {
      return;
    }

    if (isCreatingNewThreadRef.current) {
      isCreatingNewThreadRef.current = false;
    }

    const lastAssistant = [...chat.messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) {
      return;
    }
    if (lastAssistant.id === lastSavedAssistantIdRef.current) {
      return;
    }

    const persist = async () => {
      if (!resourceId || !isAuthenticated) {
        return;
      }

      try {
        const ensuredThreadId = await ensureThreadId();

        // Only persist the assistant message (user message was already persisted in onNew)
        const assistantMastraMessage = buildMastraMessageFromUIMessage({
          message: lastAssistant,
          threadId: ensuredThreadId,
          resourceId,
        });

        await mastraClient.saveMessageToMemory({
          agentId,
          messages: [assistantMastraMessage] as unknown as MastraMessageV2[], // TODO: fix this, its temporary until we have a v3 api (ai-v5 sdk)
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
  }, [
    chat.messages,
    chat.status,
    ensureThreadId,
    mastraClient,
    agentId,
    resourceId,
    isAuthenticated,
  ]);

  return { runtime };
}
