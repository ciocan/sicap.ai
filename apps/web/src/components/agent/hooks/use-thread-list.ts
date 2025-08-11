import type { ExternalStoreThreadData, ExternalStoreThreadListAdapter } from "@assistant-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const { agentId, threadId, resourceId, setThreadId: setUrlThreadId } = args;

  const client = useMastraClient();

  // Local selection state to ensure UI highlights correctly when list loads asynchronously
  const [activeThreadId, setActiveThreadId] = useState<string>("");

  const onSwitchToThread = useCallback(
    (id: string) => {
      setActiveThreadId(id);
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

  // Ensure initial selection is highlighted after threads load
  const didSyncSelectionRef = useRef(false);
  useEffect(() => {
    if (didSyncSelectionRef.current) {
      return;
    }
    if (!threadId) {
      return;
    }
    if (threads.length === 0) {
      return;
    }
    const exists = threads.some((t) => t.threadId === threadId);
    if (!exists) {
      return;
    }
    didSyncSelectionRef.current = true;
    // Simulate a user switch to ensure primitives mark the item as active
    onSwitchToThread(threadId);
  }, [threads, threadId, onSwitchToThread]);

  // Keep local active selection in sync with external threadId changes
  useEffect(() => {
    if (!threadId) {
      return;
    }
    setActiveThreadId(threadId);
  }, [threadId]);

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
    onSwitchToThread(threadId);
  }, [client, agentId, resourceId, fetchThreads, onSwitchToThread]);

  return {
    threads,
    threadId: activeThreadId,
    onArchive,
    onSwitchToNewThread,
    onSwitchToThread,
  };
};
