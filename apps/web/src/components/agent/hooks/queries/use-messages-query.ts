import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import type { MastraClient } from "@mastra/client-js";
import type { MastraMessageV2 } from "@mastra/core/memory";

// Helper to configure mastra client with credentials
const configureMastraClient = (client: any) => {
  const originalRequest = client.request.bind(client);
  client.request = async (path: string, options: any) => {
    const modifiedOptions = {
      ...options,
      credentials: "include" as RequestCredentials,
    };
    return originalRequest(path, modifiedOptions);
  };
  return client;
};

// Query key factory for messages
export const messagesQueryKeys = {
  all: ["messages"] as const,
  threads: () => [...messagesQueryKeys.all, "thread"] as const,
  thread: (threadId: string, agentId: string) =>
    [...messagesQueryKeys.threads(), { threadId, agentId }] as const,
};

// Fetch messages function
async function fetchMessages({
  mastraClient,
  threadId,
  agentId,
}: {
  mastraClient: MastraClient;
  threadId: string;
  agentId: string;
}): Promise<UIMessage[]> {
  const thread = configureMastraClient(mastraClient.getMemoryThread(threadId, agentId));
  const { uiMessages } = await thread.getMessages();
  return uiMessages as UIMessage[];
}

// Main hook for fetching messages
export function useMessagesQuery({
  mastraClient,
  threadId,
  agentId,
  enabled = true,
}: {
  mastraClient: MastraClient;
  threadId?: string;
  agentId: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: messagesQueryKeys.thread(threadId || "", agentId),
    queryFn: () => fetchMessages({ mastraClient, threadId: threadId!, agentId }),
    enabled: enabled && !!threadId,
    staleTime: 1000 * 30, // 30 seconds - messages are more dynamic
    refetchOnWindowFocus: false,
    // Don't retry on 404 errors (thread not found)
    retry: (failureCount, error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStatus = (error as { status?: number })?.status;

      const isThreadNotFound =
        errorMessage.includes("404") ||
        errorMessage.includes("Not Found") ||
        errorMessage.includes("not found") ||
        errorStatus === 404;

      if (isThreadNotFound) {
        return false; // Don't retry on thread not found
      }

      return failureCount < 2;
    },
  });
}

// Save message mutation
export function useSaveMessageMutation({
  mastraClient,
  agentId,
}: {
  mastraClient: MastraClient;
  agentId: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messages,
      threadId,
    }: {
      messages: MastraMessageV2[];
      threadId: string;
    }) => {
      await mastraClient.saveMessageToMemory({
        agentId,
        messages,
      });
      return { threadId };
    },
    onSuccess: ({ threadId }) => {
      // Invalidate messages for this thread to trigger a refetch
      void queryClient.invalidateQueries({
        queryKey: messagesQueryKeys.thread(threadId, agentId),
      });
    },
  });
}

// Generate title mutation
export function useGenerateTitleMutation({ mastraClient }: { mastraClient: MastraClient }) {
  return useMutation({
    mutationFn: async (threadId: string) => {
      const result = await mastraClient.request("/gen-title", {
        method: "POST",
        // @ts-expect-error TODO: fix this when mastra client supports credentials properly
        credentials: "include" as RequestCredentials,
        body: { threadId },
      });
      return result;
    },
  });
}

// Hook to check if thread exists
export function useThreadExistsQuery({
  mastraClient,
  threadId,
  agentId,
  enabled = true,
}: {
  mastraClient: MastraClient;
  threadId?: string;
  agentId: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["thread-exists", threadId, agentId],
    queryFn: async () => {
      if (!threadId) {
        return false;
      }

      try {
        const thread = configureMastraClient(mastraClient.getMemoryThread(threadId, agentId));
        await thread.get();
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStatus = (error as { status?: number })?.status;

        const isThreadNotFound =
          errorMessage.includes("404") ||
          errorMessage.includes("Not Found") ||
          errorMessage.includes("not found") ||
          errorStatus === 404;

        if (isThreadNotFound) {
          return false;
        }

        throw error; // Re-throw other errors
      }
    },
    enabled: enabled && !!threadId,
    staleTime: 1000 * 60 * 5, // 5 minutes - thread existence doesn't change often
    refetchOnWindowFocus: false,
  });
}
