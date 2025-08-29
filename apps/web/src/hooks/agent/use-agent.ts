"use client";

import { useEffect, useState } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { useRouter } from "next/navigation";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

import { useThread } from "./use-threads";

export function useAgent() {
  const [threadId] = useQueryState("t", parseAsString.withDefault(""));
  const { data, isLoading: isLoadingThread } = useThread(threadId);
  const [input, setInput] = useState("");
  const router = useRouter();

  const { messages, sendMessage, status, setMessages } = useChat({
    id: threadId,
    transport: new DefaultChatTransport({
      api: "/api/agent/chat",
    }),
  });

  useEffect(() => {
    const { uiMessages, error } = data || {};

    if (uiMessages && uiMessages.length > 0) {
      setMessages(uiMessages);
    } else if (error) {
      router.replace("/agent2");
    }
  }, [data, setMessages, router.replace]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newThreadId = crypto.randomUUID();
    router.replace(`/agent2?t=${newThreadId}`);

    if (input.trim()) {
      sendMessage({ text: input }, { body: { threadId } });
      setInput("");
    }
  };

  return {
    messages,
    status,
    input,
    setInput,
    handleSubmit,
    isLoadingThread,
  };
}
