"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

export function useAgent() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim()) {
      sendMessage({ text: input });
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
