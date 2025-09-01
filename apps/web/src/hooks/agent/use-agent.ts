"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";

import { toast } from "@sicap/ui";

import { useThreadQuery, useThreadId, useGenerateThreadTitleMutation } from "./use-threads";
import { useVoteMessageMutation } from "./use-messages";

export function useAgent() {
  const { threadId, newThreadId } = useThreadId();
  const { data, isLoading: isLoadingThread } = useThreadQuery(threadId);
  const { mutate: generateThreadTitle } = useGenerateThreadTitleMutation();
  const { mutate: voteMessage } = useVoteMessageMutation({
    onSuccess: ({ message, originalMessageId }) => {
      const newMetadata = message.content.metadata;
      setMessages(
        messages.map((m) => (m.id === originalMessageId ? { ...m, metadata: newMetadata } : m)),
      );
    },
  });
  const [input, setInput] = useState("");
  const [currentBranchIndex, setCurrentBranchIndex] = useState(0);
  const router = useRouter();

  const messagesBeforeRegenRef = useRef<UIMessage[]>([]);
  const messageIdToRegenRef = useRef<string | null>(null);

  const { messages, sendMessage, status, setMessages, regenerate, stop } = useChat({
    id: threadId,
    experimental_throttle: 100,
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: ({ messages, id, body }) => {
        return { id, body: { ...body, message: messages.at(-1) } };
      },
      api: "/api/agent/chat",
    }),
    onFinish: ({ messages, message }) => {
      if (messageIdToRegenRef.current && message.role === "assistant") {
        const originalMessages = messagesBeforeRegenRef.current;
        const originalMessage = originalMessages.find(
          (msg) => msg.id === messageIdToRegenRef.current,
        );

        if (originalMessage) {
          const mergedMessage = {
            ...originalMessage,
            parts: [...originalMessage.parts, ...message.parts],
          };

          const updatedMessages = originalMessages.map((msg) =>
            msg.id === messageIdToRegenRef.current ? mergedMessage : msg,
          );
          setMessages(updatedMessages);
        }

        messageIdToRegenRef.current = null;
        messagesBeforeRegenRef.current = [];
      }

      if (messages.length === 2) {
        const message = messages[0]?.parts[0]?.type === "text" ? messages[0]?.parts[0]?.text : "";
        generateThreadTitle({ threadId: threadId || newThreadId, message });
      }

      if (!threadId) {
        router.replace(`/agent?t=${newThreadId}`);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    const { uiMessages, error } = data || {};

    if (uiMessages && uiMessages.length > 0) {
      setMessages(uiMessages);
    } else if (error) {
      router.replace("/agent");
    }
  }, [data, setMessages, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (status === "streaming" || status === "submitted") {
      stop();
      return;
    }

    if (!input.trim()) {
      return;
    }
    const threadIdToUse = threadId || newThreadId;
    sendMessage({ text: input }, { body: { threadId: threadIdToUse } });
    setInput("");
  };

  const handleRegenerate = (messageId: string) => {
    messagesBeforeRegenRef.current = JSON.parse(JSON.stringify(messages));
    messageIdToRegenRef.current = messageId;

    const totalBranches = messages
      .filter((message) => message.id === messageId)
      .map((message) => message.parts.filter((part) => part.type === "text").length)
      .reduce((acc, curr) => acc + curr, 0);

    regenerate({ messageId, body: { threadId } });
    setCurrentBranchIndex(totalBranches);
  };

  const handleThumbsDown = (messageId: string, branchIndex?: number) => {
    voteMessage({ threadId, messageId, vote: "down", branchIndex });
  };

  const handleThumbsUp = (messageId: string, branchIndex?: number) => {
    voteMessage({ threadId, messageId, vote: "up", branchIndex });
  };

  return {
    data,
    threadId,
    messages,
    status,
    input,
    setInput,
    handleSubmit,
    isLoadingThread,
    handleRegenerate,
    currentBranchIndex,
    handleThumbsDown,
    handleThumbsUp,
  };
}
