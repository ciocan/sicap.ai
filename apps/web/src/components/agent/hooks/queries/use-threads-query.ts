import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ExternalStoreThreadData } from "@assistant-ui/react";
import type { MastraClient } from "@mastra/client-js";

import { configureMastraClient } from "@/components/agent/utils/runtime";

// Query key factory for threads
export const threadsQueryKeys = {
  all: ["threads"] as const,
  lists: () => [...threadsQueryKeys.all, "list"] as const,
  list: (agentId: string, resourceId: string) =>
    [...threadsQueryKeys.lists(), { agentId, resourceId }] as const,
};

// Fetch threads function
async function fetchThreads({
  mastraClient,
  agentId,
  resourceId,
}: {
  mastraClient: MastraClient;
  agentId: string;
  resourceId: string;
}): Promise<ExternalStoreThreadData<"regular">[]> {
  const updatedThreads = await mastraClient.getMemoryThreads({ agentId, resourceId });

  return updatedThreads
    .filter((thread) => !thread.metadata?.isArchived)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((thread) => ({
      threadId: thread.id,
      status: "regular" as const,
      title: `${thread.title}||${thread.createdAt}`, // TODO: fix this, its temporary until a better way is implemented in assistant-ui/react
    }));
}

// Main hook for fetching threads
export function useThreadsQuery({
  mastraClient,
  agentId,
  resourceId,
  isAuthenticated,
}: {
  mastraClient: MastraClient;
  agentId: string;
  resourceId?: string;
  isAuthenticated: boolean;
}) {
  return useQuery({
    queryKey: threadsQueryKeys.list(agentId, resourceId || ""),
    queryFn: () => fetchThreads({ mastraClient, agentId, resourceId: resourceId! }),
    enabled: isAuthenticated && !!resourceId,
    staleTime: 1000 * 60 * 2, // 2 minutes - threads don't change frequently
    refetchOnWindowFocus: false,
  });
}

// Archive thread mutation
export function useArchiveThreadMutation({
  mastraClient,
  agentId,
  resourceId,
}: {
  mastraClient: MastraClient;
  agentId: string;
  resourceId?: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadId: string) => {
      const thread = configureMastraClient(mastraClient.getMemoryThread(threadId, agentId));
      const threadData = await thread.get();

      await thread.update({
        ...threadData,
        title: threadData.title ?? "",
        metadata: {
          ...threadData?.metadata,
          isArchived: true,
        },
      });
    },
    onSuccess: () => {
      // Invalidate and refetch threads after archiving
      if (resourceId) {
        void queryClient.invalidateQueries({
          queryKey: threadsQueryKeys.list(agentId, resourceId),
        });
      }
    },
  });
}

// Create thread mutation
export function useCreateThreadMutation({
  mastraClient,
  agentId,
  resourceId,
}: {
  mastraClient: MastraClient;
  agentId: string;
  resourceId?: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      threadId,
      title = "Conversatie noua...",
      metadata = { hasDefaultTitle: true },
    }: {
      threadId: string;
      title?: string;
      metadata?: Record<string, any>;
    }) => {
      if (!resourceId) {
        throw new Error("Resource ID is required");
      }

      await mastraClient.createMemoryThread({
        title,
        agentId,
        resourceId,
        metadata,
        threadId,
      });

      return threadId;
    },
    onSuccess: () => {
      // Invalidate and refetch threads after creating
      if (resourceId) {
        void queryClient.invalidateQueries({
          queryKey: threadsQueryKeys.list(agentId, resourceId),
        });
      }
    },
  });
}
