import { useExternalStoreRuntime, type ThreadMessageLike } from "@assistant-ui/react";
import { useMemo, useState, useEffect, useRef } from "react";
import type { AppendMessage } from "@assistant-ui/react";

import { toast } from "@sicap/ui";

import { useThreadContext, useThreadList } from "./thread-context";
import { getSessionId } from "@/utils/session";
import { useIdentify } from "@/hooks";
import { useIsCreatingNewThread, useSetIsCreatingNewThread } from "@/components/agent/stores";

const convertMessage = (message: ThreadMessageLike): ThreadMessageLike => {
  return message;
};

export function useAgentRuntime() {
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState<ThreadMessageLike[]>([]);

  const {
    agentId,
    resourceId,
    threadId,
    ensureThreadId,
    mastraClient,
    abortController,
    refetchThreads,
  } = useThreadContext();
  const threadList = useThreadList();
  const { isAuthenticated } = useIdentify();

  // Thread state management
  const redirectedThreadsRef = useRef(new Set<string>());
  const threadsCreatedInSessionRef = useRef(new Set<string>());
  const isCreatingNewThread = useIsCreatingNewThread();
  const setIsCreatingNewThread = useSetIsCreatingNewThread();

  // Stream management
  const currentReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  // Generate a stable sessionId for this browser session
  const _sessionId = useMemo(() => getSessionId(threadId), [threadId]);

  // Load messages when threadId changes
  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      redirectedThreadsRef.current.clear();
      threadsCreatedInSessionRef.current.clear();
      return;
    }

    // Skip loading if creating a new thread to prevent race conditions
    if (isCreatingNewThread) {
      return;
    }

    // Skip loading messages for threads created in this session - state already correct
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

        // Convert UI messages to ThreadMessageLike format
        const threadMessages: ThreadMessageLike[] = (uiMessages || [])
          .filter((msg) => msg.role !== "data") // Filter out data messages
          .map((msg) => ({
            role: msg.role as "user" | "system" | "assistant",
            content: typeof msg.content === "string" ? msg.content : msg.content,
          }));

        setMessages(threadMessages);

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
  }, [threadId, agentId, mastraClient, isCreatingNewThread, threadList]);

  const runtime = useExternalStoreRuntime({
    isRunning,
    messages,
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

      if (message.content[0]?.type !== "text") {
        throw new Error("Only text messages are supported");
      }

      const input = message.content[0].text;
      setMessages((currentConversation) => [
        ...currentConversation,
        { role: "user", content: input },
      ]);
      setIsRunning(true);

      try {
        const agent = mastraClient.getAgent(agentId);

        const response = await agent.streamVNext({
          messages: [
            {
              role: "user",
              content: input,
            },
          ],
          runtimeContext: {
            userId: resourceId,
            sessionId: ensuredThreadId,
            threadId: ensuredThreadId,
          },
          resourceId,
          threadId: ensuredThreadId,
          runId: ensuredThreadId,
        });

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        currentReaderRef.current = reader;
        const decoder = new TextDecoder();

        let assistantMessage = "";
        let assistantMessageAdded = false;
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Process complete lines
            const lines = buffer.split("\n");
            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ") && line !== "data: [DONE]") {
                const jsonData = line.substring(6).trim();
                if (!jsonData) {
                  continue;
                }

                try {
                  const data = JSON.parse(jsonData);

                  if (data.type === "text-delta" && data.payload?.text) {
                    assistantMessage += data.payload.text;

                    setMessages((currentConversation) => {
                      const message: ThreadMessageLike = {
                        role: "assistant",
                        content: [{ type: "text", text: assistantMessage }],
                      };

                      if (!assistantMessageAdded) {
                        assistantMessageAdded = true;
                        return [...currentConversation, message];
                      }
                      return [...currentConversation.slice(0, -1), message];
                    });
                  }
                } catch {
                  // Skip malformed JSON - this can happen with large objects
                  // that are split across chunks
                }
              }
            }
          }
        } catch (streamError) {
          console.error("Stream error:", streamError);
        } finally {
          // Always release the reader lock, even if an error occurred
          try {
            reader.releaseLock();
          } catch (lockError) {
            // Reader might already be released
            console.warn("Reader lock release error:", lockError);
          }

          // Clear the current reader ref
          currentReaderRef.current = null;

          setIsRunning(false);

          // Generate title for new threads
          if (messages.length === 0) {
            void mastraClient
              .request("/gen-title", {
                method: "POST",
                body: {
                  threadId: ensuredThreadId,
                  message: input,
                },
              })
              .then(refetchThreads)
              .catch((error) => {
                console.error("Error generating title", error);
              });
          }
        }
      } catch (error) {
        // Check if it's an abort error (user cancelled)
        if (error instanceof Error && error.name === "AbortError") {
          console.log("Stream was cancelled by user");
        } else {
          console.error("Error in onNew:", error);
        }
        setIsRunning(false);
      }
    },
    onCancel: async () => {
      // Cancel the current stream by releasing the reader
      console.log("onCancel");
      if (currentReaderRef.current) {
        try {
          await currentReaderRef.current.cancel();
          currentReaderRef.current.releaseLock();
        } catch (error) {
          console.warn("Error cancelling stream:", error);
        } finally {
          currentReaderRef.current = null;
        }
      }

      // Also use the abort controller if available
      if (abortController) {
        abortController.abort();
      }

      setIsRunning(false);
    },
    onEdit: async (_message: AppendMessage) => {
      // Handle message editing if needed
    },
    onReload: async (_parentId: string | null) => {
      // Handle reload if needed
    },
    onAddToolResult: ({ toolCallId: _toolCallId, result: _result }) => {
      // Handle tool results if needed
    },
    convertMessage,
    adapters: { threadList },
  });

  // Reset new thread flag when streaming completes
  useEffect(() => {
    if (!isRunning && isCreatingNewThread) {
      setIsCreatingNewThread(false);
    }
  }, [isRunning, isCreatingNewThread, setIsCreatingNewThread]);

  return { runtime };
}
