"use client";

import { useEffect, useState } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { useRouter } from "next/navigation";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

import { useThread } from "./use-threads";

export function useAgent() {
  const [threadId, setThreadId] = useQueryState("t", parseAsString.withDefault(""));
  const [newThreadId] = useState(crypto.randomUUID());
  const { data, isLoading: isLoadingThread } = useThread(threadId);
  const [input, setInput] = useState("");
  const router = useRouter();

  const { messages, sendMessage, status, setMessages } = useChat({
    id: threadId,
    transport: new DefaultChatTransport({
      api: "/api/agent/chat",
    }),
    onFinish: () => {
      if (!threadId) {
        setThreadId(newThreadId);
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
