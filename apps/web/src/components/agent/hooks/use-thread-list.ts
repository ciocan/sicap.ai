import type { ExternalStoreThreadData, ExternalStoreThreadListAdapter } from "@assistant-ui/react";
import { useCallback, useEffect, useState } from "react";

import { useMastraClient } from "./use-mastra-client";
import { generateId } from "@/utils";

interface UseMastraThreadListArgs {
  agentId: string;
  threadId: string;
  resourceId: string;
  setThreadId(threadId: string): void;
}

export const useThreadList = (args: UseMastraThreadListArgs): ExternalStoreThreadListAdapter => {
  const [threads, setThreads] = useState<ExternalStoreThreadData<"regular">[]>([]);
  const { agentId, threadId, resourceId, setThreadId } = args;

  const client = useMastraClient();

  const fetchThreads = useCallback(async () => {
    const updatedThreads = await client.getMemoryThreads({
      agentId,
      resourceId,
    });

    setThreads(
      updatedThreads
        .filter((thread) => !thread.metadata?.isArchived)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .map((thread) => ({
          threadId: thread.id,
          title: thread.title,
          status: "regular",
        })),
    );
  }, [client, agentId, resourceId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const onArchive = useCallback(
    async (threadId: string) => {
      const thread = client.getMemoryThread(threadId, agentId);
      const threadData = await thread.get();

      await thread.update({
        ...threadData,
        title: threadData.title ?? "Conversatie nouă",
        metadata: {
          ...threadData?.metadata,
          isArchived: true,
        },
      });
      await fetchThreads();
    },
    [client, agentId, fetchThreads],
  );

  const onSwitchToNewThread = useCallback(async () => {
    const threadId = generateId();
    await client.createMemoryThread({
      agentId,
      resourceId,
      metadata: {},
      threadId,
    });
    await fetchThreads();
    setThreadId(threadId);
  }, [client, agentId, resourceId, fetchThreads, setThreadId]);

  return {
    threads,
    threadId,
    onArchive,
    onSwitchToNewThread,
    onSwitchToThread: setThreadId,
  };
};
