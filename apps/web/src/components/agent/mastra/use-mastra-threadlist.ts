import type { ExternalStoreThreadData, ExternalStoreThreadListAdapter } from "@assistant-ui/react";
import { useMastraClient } from "./use-mastra-client";
import { useCallback, useEffect, useState } from "react";

interface UseMastraThreadListArgs {
  agentId: string;
  baseUrl?: string;
  threadId: string;
  resourceId: string;
  setThreadId(threadId: string): void;
}

export const useMastraThreadList = (
  args: UseMastraThreadListArgs,
): ExternalStoreThreadListAdapter => {
  const [threads, setThreads] = useState<ExternalStoreThreadData<"regular">[]>([]);
  const [archivedThreads, setArchivedThreads] = useState<ExternalStoreThreadData<"archived">[]>([]);

  const client = useMastraClient();

  const fetchThreads = useCallback(async () => {
    const updatedThreads = await client.getMemoryThreads({
      agentId: args.agentId,
      resourceId: args.resourceId,
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
    setArchivedThreads(
      updatedThreads
        .filter((thread) => thread.metadata?.isArchived)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .map((thread) => ({
          threadId: thread.id,
          title: thread.title,
          status: "archived",
        })),
    );
  }, [client, args.agentId, args.resourceId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const onArchive = useCallback(
    async (threadId: string) => {
      const thread = client.getMemoryThread(threadId, args.agentId);
      const threadData = await thread.get();

      await thread.update({
        ...threadData,
        title: threadData.title ?? "",
        metadata: {
          ...threadData?.metadata,
          isArchived: true,
        },
      });
      await fetchThreads();
    },
    [client, args.agentId, fetchThreads],
  );

  const onDelete = useCallback(
    async (threadId: string) => {
      const thread = client.getMemoryThread(threadId, args.agentId);
      await thread.delete();
      await fetchThreads();
    },
    [client, args.agentId, fetchThreads],
  );

  const onRename = useCallback(
    async (threadId: string, newTitle: string) => {
      const thread = client.getMemoryThread(threadId, args.agentId);
      const threadData = await thread.get();

      await thread.update({
        ...threadData,
        title: newTitle,
        metadata: threadData.metadata ?? {},
      });

      await fetchThreads();
    },
    [client, args.agentId, fetchThreads],
  );

  const onUnarchive = useCallback(
    async (threadId: string) => {
      const thread = client.getMemoryThread(threadId, args.agentId);
      const threadData = await thread.get();

      await thread.update({
        ...threadData,
        title: threadData.title ?? "",
        metadata: {
          ...threadData?.metadata,
          isArchived: false,
        },
      });
      await fetchThreads();
    },
    [client, args.agentId, fetchThreads],
  );

  const onSwitchToNewThread = useCallback(async () => {
    const threadId = crypto.randomUUID();
    await client.createMemoryThread({
      title: "",
      agentId: args.agentId,
      resourceId: args.resourceId,
      metadata: {},
      threadId,
    });
    await fetchThreads();
    args.setThreadId(threadId);
  }, [client, args.agentId, args.resourceId, fetchThreads, args.setThreadId]);

  return {
    threads,
    archivedThreads,
    threadId: args.threadId,
    onArchive,
    onDelete,
    onRename,
    onUnarchive,
    onSwitchToNewThread,
    onSwitchToThread: args.setThreadId,
  };
};
