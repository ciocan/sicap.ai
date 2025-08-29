import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export const useArchiveThreadMutation = () => {
  const { threadId: activeThreadId, setThreadId } = useThreadId();
  const queryClient = useQueryClient();

  const handleArchiveThread = async (threadId: string) => {
    try {
      const response = await fetch(`/api/agent/thread/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId }),
      });

      if (response.ok) {
        if (threadId === activeThreadId) {
          setThreadId("");
        }
      }
    } catch (error) {
      console.error("Failed to archive thread:", error);
    }
  };

  return useMutation({
    mutationFn: handleArchiveThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });
};

export const generateThreadTitle = async ({
  threadId,
  message,
}: {
  threadId: string;
  message: string;
}) => {
  if (!threadId || !message) {
    throw new Error("threadId and message are required");
  }

  try {
    await fetch(`/api/agent/thread/gen-title`, {
      method: "POST",
      body: JSON.stringify({ threadId, message }),
    });
  } catch (error) {
    console.error("Failed to generate thread title:", error);
  }
};

export const useGenerateThreadTitleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateThreadTitle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });
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
