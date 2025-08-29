"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { useRouter } from "next/navigation";

export function useAgent() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();
  const router = useRouter();
  const [threadId] = useQueryState("t", parseAsString.withDefault(crypto.randomUUID()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    router.replace(`/agent2?t=${threadId}`);

    if (input.trim()) {
      sendMessage({ text: input }, { body: { threadId } });
      setInput("");
    }
  };

  const displayValue = input;

  return {
    // Chat state
    messages,
    status,

    // Input state
    input,
    setInput,
    displayValue,

    // Event handlers
    handleSubmit,
  };
}
