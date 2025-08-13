"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ExternalStoreThreadData, ExternalStoreThreadListAdapter } from "@assistant-ui/react";
import { useQueryState, parseAsString } from "nuqs";

import { useMastraClient } from "./use-mastra-client";
import { generateId } from "@/utils";

interface ThreadContextValue {
  agentId: string;
  resourceId: string;

  // selection
  threadId: string;
  setThreadId: (id: string) => void;

  // list
  isLoading: boolean;
  threads: ExternalStoreThreadData<"regular">[];
  fetchThreads: () => Promise<void>;

  // hydration state
  isHydrated: boolean;

  // actions
  onArchive: (threadId: string) => Promise<void>;
  onSwitchToThread: (id: string) => void;
  onSwitchToNewThread: () => void;

  // utilities
  ensureThreadId: () => Promise<string>;
}

const ThreadContext = createContext<ThreadContextValue | null>(null);

interface ThreadProviderProps {
  children: React.ReactNode;
  agentId?: string;
  resourceId?: string;
}

const DEFAULT_AGENT_ID = "sicapAgent" as const;
const DEFAULT_RESOURCE_ID = "anon-ae576d00-963f-4b0d-8abe-27b4ccab1229" as const; // TODO: replace with userId

export function ThreadProvider({
  children,
  agentId: providedAgentId = DEFAULT_AGENT_ID,
  resourceId: providedResourceId = DEFAULT_RESOURCE_ID,
}: ThreadProviderProps) {
  const [threadId, setThreadId] = useQueryState("t", parseAsString.withDefault(""));
  const [threads, setThreads] = useState<ExternalStoreThreadData<"regular">[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const client = useMastraClient();

  const agentId = providedAgentId;
  const resourceId = providedResourceId;

  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    try {
      const updatedThreads = await client.getMemoryThreads({ agentId, resourceId });
      setThreads(
        updatedThreads
          .filter((thread) => !thread.metadata?.isArchived)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((thread) => ({
            threadId: thread.id,
            title: thread.title,
            status: "regular" as const,
          })),
      );
    } finally {
      setIsLoading(false);
    }
  }, [client, agentId, resourceId]);

  useEffect(() => {
    void fetchThreads();
  }, [fetchThreads]);

  // Handle hydration state - wait for next tick to ensure URL params are parsed
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const onArchive = useCallback(
    async (archiveThreadId: string) => {
      const thread = client.getMemoryThread(archiveThreadId, agentId);
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
    [client, agentId, fetchThreads],
  );

  const onSwitchToThread = useCallback(
    (id: string) => {
      setThreadId(id);
    },
    [setThreadId],
  );

  const onSwitchToNewThread = useCallback(() => {
    setThreadId("");
  }, [setThreadId]);

  const ensureThreadId = useCallback(async (): Promise<string> => {
    if (threadId) {
      try {
        const thread = client.getMemoryThread(threadId, agentId);
        await thread.get();
        return threadId;
      } catch {
        await client.createMemoryThread({
          agentId,
          resourceId,
          metadata: {},
          threadId,
        });
        // Ensure list includes it
        await fetchThreads();
        return threadId;
      }
    }
    const newId = generateId();
    await client.createMemoryThread({
      agentId,
      resourceId,
      metadata: {},
      threadId: newId,
    });
    setThreadId(newId);
    await fetchThreads();
    return newId;
  }, [threadId, client, agentId, resourceId, fetchThreads, setThreadId]);

  const value: ThreadContextValue = useMemo(
    () => ({
      agentId,
      resourceId,
      threadId,
      setThreadId,
      isLoading,
      threads,
      fetchThreads,
      isHydrated,
      onArchive,
      onSwitchToThread,
      onSwitchToNewThread,
      ensureThreadId,
    }),
    [
      agentId,
      resourceId,
      threadId,
      setThreadId,
      isLoading,
      threads,
      fetchThreads,
      isHydrated,
      onArchive,
      onSwitchToThread,
      onSwitchToNewThread,
      ensureThreadId,
    ],
  );

  return <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>;
}

export function useThreadContext(): ThreadContextValue {
  const ctx = useContext(ThreadContext);
  if (!ctx) {
    throw new Error("useThreadContext must be used within a ThreadProvider");
  }
  return ctx;
}

export const useThreadList = (): ExternalStoreThreadListAdapter => {
  const {
    isLoading,
    threads,
    threadId,
    onArchive,
    onSwitchToNewThread,
    onSwitchToThread,
    isHydrated,
  } = useThreadContext();

  // Return proper threadId only after hydration, otherwise empty string
  // This ensures @assistant-ui/react components don't render with stale state
  const effectiveThreadId = isHydrated ? threadId : "";

  return {
    isLoading,
    threads,
    threadId: effectiveThreadId,
    onArchive,
    onSwitchToNewThread,
    onSwitchToThread,
  };
};
