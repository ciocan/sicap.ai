import { useMemo } from 'react'
import type { ExternalStoreThreadData } from '@assistant-ui/react'
import { useThreadContext } from './thread-context'

// Optimized hook that only returns state data (no actions)
// This prevents re-renders when only actions change
export function useThreadState() {
  const context = useThreadContext()
  
  return useMemo(() => ({
    agentId: context.agentId,
    resourceId: context.resourceId,
    threadId: context.threadId,
    isLoading: context.isLoading,
    threads: context.threads,
    isHydrated: context.isHydrated,
  }), [
    context.agentId,
    context.resourceId,
    context.threadId,
    context.isLoading,
    context.threads,
    context.isHydrated,
  ])
}

// Optimized hook that only returns actions (no state)
// This prevents re-renders when only state changes
export function useThreadActions() {
  const context = useThreadContext()
  
  return useMemo(() => ({
    setThreadId: context.setThreadId,
    refetchThreads: context.refetchThreads,
    onArchive: context.onArchive,
    onSwitchToThread: context.onSwitchToThread,
    onSwitchToNewThread: context.onSwitchToNewThread,
    ensureThreadId: context.ensureThreadId,
  }), [
    context.setThreadId,
    context.refetchThreads,
    context.onArchive,
    context.onSwitchToThread,
    context.onSwitchToNewThread,
    context.ensureThreadId,
  ])
}

// Optimized hook for just the mastra client
export function useMastraClientFromContext() {
  const context = useThreadContext()
  return context.mastraClient
}