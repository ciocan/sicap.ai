"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  type ExternalStoreThreadData,
  type ExternalStoreThreadListAdapter,
  useThreadListItem,
} from "@assistant-ui/react";
import { useQueryState, parseAsString } from "nuqs";
import type { MastraClient } from "@mastra/client-js";

import { useMastraClient } from "./use-mastra-client";
import { useThreadsQuery, useArchiveThreadMutation, useCreateThreadMutation } from "./queries";
import { generateId } from "@/utils";
import { getSessionId } from "@/utils/session";
import { useIdentify } from "@/hooks";

interface ThreadContextValue {
  agentId: string;
  resourceId?: string;

  // selection
  threadId: string;
  setThreadId: (id: string) => void;

  // list (from React Query)
  isLoading: boolean;
  threads: ExternalStoreThreadData<"regular">[];
  refetchThreads: () => Promise<void>;

  // hydration state
  isHydrated: boolean;

  // actions
  onArchive: (threadId: string) => Promise<void>;
  onSwitchToThread: (id: string) => void;
  onSwitchToNewThread: () => void;

  // utilities
  ensureThreadId: () => Promise<string>;

  // client
  mastraClient: MastraClient;
}

const ThreadContext = createContext<ThreadContextValue | null>(null);

interface ThreadProviderProps {
  children: React.ReactNode;
  agentId: string;
}

export function ThreadProvider({ children, agentId }: ThreadProviderProps) {
  const [threadId, setThreadId] = useQueryState("t", parseAsString.withDefault(""));
  const [isHydrated, setIsHydrated] = useState(false);
  const { isAuthenticated, userId: resourceId } = useIdentify();

  // Get sessionId for tracking
  const sessionId = useMemo(() => getSessionId(threadId), [threadId]);

  // Create client with headers
  const mastraClient = useMastraClient({ sessionId });

  // React Query hooks
  const {
    data: threads = [],
    isLoading,
    refetch: refetchThreads,
  } = useThreadsQuery({
    mastraClient,
    agentId,
    resourceId,
    isAuthenticated,
  });

  const archiveThreadMutation = useArchiveThreadMutation({
    mastraClient,
    agentId,
    resourceId,
  });

  const createThreadMutation = useCreateThreadMutation({
    mastraClient,
    agentId,
    resourceId,
  });

  // Wrapper function for backwards compatibility
  const fetchThreads = useCallback(async () => {
    if (!isAuthenticated || !resourceId) {
      return;
    }
    await refetchThreads();
  }, [refetchThreads, isAuthenticated, resourceId]);

  // Handle hydration state - wait for next tick to ensure URL params are parsed
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []); // Empty dependency array is correct here

  const onArchive = useCallback(
    async (archiveThreadId: string) => {
      await archiveThreadMutation.mutateAsync(archiveThreadId);
    },
    [archiveThreadMutation],
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
    if (!isAuthenticated || !resourceId) {
      return Promise.resolve("");
    }

    const title = "Conversatie noua...";
    const metadata = { hasDefaultTitle: true }; // TODO: temporary until genTitle is fixed

    if (threadId) {
      try {
        // Check if thread exists
        const thread = mastraClient.getMemoryThread(threadId, agentId);
        const originalRequest = thread.request.bind(thread);
        thread.request = async (path, options) => {
          const modifiedOptions = {
            ...options,
            credentials: "include" as RequestCredentials,
          };
          return originalRequest(path, modifiedOptions);
        };

        await thread.get();
        return threadId;
      } catch {
        // Thread doesn't exist, create it with the current threadId
        await createThreadMutation.mutateAsync({
          threadId,
          title,
          metadata,
        });
        return threadId;
      }
    }

    // No threadId, create a new one
    const newId = generateId();
    await createThreadMutation.mutateAsync({
      threadId: newId,
      title,
      metadata,
    });
    setThreadId(newId);
    return newId;
  }, [
    threadId,
    mastraClient,
    agentId,
    resourceId,
    setThreadId,
    isAuthenticated,
    createThreadMutation,
  ]);

  // Memoize stable values separately to reduce re-renders
  const stableActions = useMemo(
    () => ({
      onArchive,
      onSwitchToThread,
      onSwitchToNewThread,
      ensureThreadId,
      refetchThreads: fetchThreads, // Renamed for backwards compatibility
      setThreadId,
    }),
    [onArchive, onSwitchToThread, onSwitchToNewThread, ensureThreadId, fetchThreads, setThreadId],
  );

  const stableConfig = useMemo(
    () => ({
      agentId,
      resourceId,
      mastraClient,
    }),
    [agentId, resourceId, mastraClient],
  );

  const value: ThreadContextValue = useMemo(
    () => ({
      ...stableConfig,
      ...stableActions,
      threadId,
      isLoading,
      threads,
      isHydrated,
    }),
    [stableConfig, stableActions, threadId, isLoading, threads, isHydrated],
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

  // Memoize to provide a stable adapter reference and avoid re-renders/loops
  return useMemo(
    () => ({
      isLoading,
      threads,
      threadId: effectiveThreadId,
      onArchive,
      onSwitchToNewThread,
      onSwitchToThread,
    }),
    [isLoading, threads, effectiveThreadId, onArchive, onSwitchToNewThread, onSwitchToThread],
  );
};

export const useIsActiveThread = () => {
  const { threadId: activeThreadId } = useThreadContext();
  const listItemId = useThreadListItem((item) => item.id);
  return listItemId === activeThreadId;
};
