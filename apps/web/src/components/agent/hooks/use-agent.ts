import { useExternalStoreRuntime } from "@assistant-ui/react";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
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

// Helper to configure mastra client with credentials
const configureMastraClient = (client: any) => {
  const originalRequest = client.request.bind(client);
  client.request = async (path: string, options: any) => {
    const modifiedOptions = {
      ...options,
      credentials: "include" as RequestCredentials,
    };
    return originalRequest(path, modifiedOptions);
  };
  return client;
};

export function useAgentRuntime() {
  const { agentId, resourceId, threadId, ensureThreadId, refetchThreads, mastraClient } =
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

  // Load messages when threadId changes
  useEffect(() => {
    // Stop any ongoing streaming when switching threads
    if (chat.status === "streaming" || chat.status === "submitted") {
      chat.stop();
    }

    if (!threadId) {
      chat.setMessages([]);
      redirectedThreadsRef.current.clear();
      setInvalidThreadId(null);
      return;
    }

    // Skip loading if creating a new thread to prevent race conditions
    if (isCreatingNewThreadRef.current) {
      return;
    }

    let cancelled = false;
    
    const loadMessages = async () => {
      try {
        const thread = configureMastraClient(
          mastraClient.getMemoryThread(threadId, agentId)
        );

        const { uiMessages } = await thread.getMessages();

        if (cancelled) return;

        chat.setMessages(uiMessages as UIMessage[]);
        
        // Track the last assistant message id from loaded history to prevent re-saving
        const lastAssistant = [...(uiMessages as UIMessage[])]
          .reverse()
          .find((m) => m.role === "assistant");
        lastSavedAssistantIdRef.current = lastAssistant?.id ?? null;
        
        // Clear error states on successful load
        redirectedThreadsRef.current.clear();
        setInvalidThreadId(null);
      } catch (error) {
        if (cancelled) return;

        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStatus = (error as { status?: number })?.status;

        const isThreadNotFound =
          errorMessage.includes("404") ||
          errorMessage.includes("Not Found") ||
          errorMessage.includes("not found") ||
          errorStatus === 404;

        if (isThreadNotFound) {
          setInvalidThreadId(threadId);
        }
        // For other errors, silently continue (could be temporary network issues)
      }
    };

    void loadMessages();
    
    return () => {
      cancelled = true;
    };
  }, [threadId, agentId, mastraClient]);

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

      const wasNewThread = !threadId;
      if (wasNewThread) {
        isCreatingNewThreadRef.current = true;
      }

      const ensuredThreadId = await ensureThreadId();

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
              // @ts-expect-error TODO: fix this when mastra client supports credentials properly
              credentials: "include" as RequestCredentials,
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
    
    if (isRunning) return;

    // Reset new thread flag when streaming completes
    if (isCreatingNewThreadRef.current) {
      isCreatingNewThreadRef.current = false;
    }

    const lastAssistant = [...chat.messages]
      .reverse()
      .find((m) => m.role === "assistant");
      
    if (!lastAssistant || lastAssistant.id === lastSavedAssistantIdRef.current) {
      return;
    }

    if (!resourceId || !isAuthenticated) return;

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
  }, [chat.status, chat.messages, ensureThreadId, mastraClient, agentId, resourceId, isAuthenticated]);

  return { runtime };
}
