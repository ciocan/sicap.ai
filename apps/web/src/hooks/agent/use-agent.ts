"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

import { useThreadQuery, useThreadId, useGenerateThreadTitleMutation } from "./use-threads";

export function useAgent() {
  const { threadId, newThreadId } = useThreadId();
  const { data, isLoading: isLoadingThread } = useThreadQuery(threadId);
  const { mutate: generateThreadTitle } = useGenerateThreadTitleMutation();
  const [input, setInput] = useState("");
  const router = useRouter();

  const { messages, sendMessage, status, setMessages } = useChat({
    id: threadId,
    transport: new DefaultChatTransport({
      api: "/api/agent/chat",
    }),
    onFinish: ({ messages }) => {
      if (messages.length === 2) {
        const message = messages[0]?.parts[0]?.type === "text" ? messages[0]?.parts[0]?.text : "";
        generateThreadTitle({ threadId: newThreadId, message });
      }

      if (!threadId) {
        router.replace(`/agent2?t=${newThreadId}`);
      }
    },
  });

  useEffect(() => {
    const { uiMessages, error } = data || {};

    if (uiMessages && uiMessages.length > 0) {
      setMessages(uiMessages);
    } else if (error) {
      router.replace("/agent2");
    }
  }, [data, setMessages, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const threadIdToUse = threadId || newThreadId;
    sendMessage({ text: input }, { body: { threadId: threadIdToUse } });
    setInput("");
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
  };
}
