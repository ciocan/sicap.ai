import type { ExternalStoreThreadData, ExternalStoreThreadListAdapter } from "@assistant-ui/react";
import { useCallback, useEffect, useState } from "react";

import { useMastraClient } from "./use-mastra-client";

interface UseMastraThreadListArgs {
  agentId: string;
  threadId: string | null;
  resourceId: string;
  setThreadId(threadId: string | null): void;
}

export const useThreadList = (args: UseMastraThreadListArgs): ExternalStoreThreadListAdapter => {
  const [threads, setThreads] = useState<ExternalStoreThreadData<"regular">[]>([]);
  const { agentId, threadId, resourceId, setThreadId: setUrlThreadId } = args;

  const client = useMastraClient();

  const onSwitchToThread = useCallback(
    (id: string) => {
      setUrlThreadId(id);
    },
    [setUrlThreadId],
  );

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

  // Keep the thread list fresh; selection comes only from the URL param
  useEffect(() => {
    void fetchThreads();
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
    // Redirect to /agent (no t); messages and selection cleared
    setUrlThreadId(null);
    await fetchThreads();
  }, [fetchThreads, setUrlThreadId]);

  return {
    threads,
    threadId: threadId ?? "",
    onArchive,
    onSwitchToNewThread,
    onSwitchToThread,
  };
};
