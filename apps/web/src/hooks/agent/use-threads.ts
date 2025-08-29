import { useQuery } from "@tanstack/react-query";
import type { UIMessage } from "ai";

import { useIdentify } from "@/hooks/use-identify";

const fetchThread = async (threadId: string) => {
  const response = await fetch(`/api/agent/thread?threadId=${threadId}`);
  return response.json();
};

export function useThread(threadId: string) {
  const { isAuthenticated } = useIdentify();

  return useQuery<{ uiMessages: UIMessage[]; error?: string }>({
    queryKey: ["thread", threadId],
    queryFn: () => fetchThread(threadId),
    enabled: !!threadId && !!isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes - threads don't change frequently
    refetchOnWindowFocus: false,
  });
}
