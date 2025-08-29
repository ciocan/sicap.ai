import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { useState } from "react";
import type { UIMessage } from "ai";

import { useIdentify } from "@/hooks/use-identify";

const fetchThread = async (threadId: string) => {
  const response = await fetch(`/api/agent/thread?threadId=${threadId}`);
  return response.json();
};

const fetchThreads = async () => {
  const response = await fetch("/api/agent/threads");
  return response.json();
};

export const useThreadId = () => {
  const [threadId, setThreadId] = useQueryState("t", parseAsString.withDefault(""));
  const [newThreadId] = useState(crypto.randomUUID());
  return { threadId, setThreadId, newThreadId };
};

export function useThreadQuery(threadId: string) {
  const { isAuthenticated } = useIdentify();

  return useQuery<{ uiMessages: UIMessage[]; error?: string }>({
    queryKey: ["thread", threadId],
    queryFn: () => fetchThread(threadId),
    enabled: !!threadId && !!isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes - threads don't change frequently
    refetchOnWindowFocus: false,
  });
}

export function useThreadsQuery() {
  const { isAuthenticated } = useIdentify();

  return useQuery({
    queryKey: ["threads"],
    queryFn: fetchThreads,
    enabled: !!isAuthenticated,
  });
}
