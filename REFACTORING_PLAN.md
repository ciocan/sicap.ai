# Web Agent Refactoring Plan: React & State Management Best Practices

## 🎯 Goals
- Improve performance by reducing unnecessary re-renders
- Better separation of concerns (server state vs UI state)
- More predictable state management
- Better error handling and loading states
- Maintain all existing functionality

## 📈 Phase 1: Clean Up Current Code Structure

**Why start here:** Before adding new libraries, let's optimize what we have to identify actual pain points and ensure a solid foundation.

### 1.1 Optimize ThreadProvider
- Reduce the massive context value object that causes re-renders
- Split complex effects into focused ones
- Improve dependency arrays to prevent unnecessary executions

### 1.2 Clean up useAgentRuntime
- Simplify the complex message loading logic
- Better error handling
- Reduce the number of useEffect hooks

### 1.3 Provider Hierarchy
- Ensure AssistantRuntimeProvider wraps all components correctly
- Fix any remaining context issues

## 📊 Phase 2: Add React Query for Server State

**Why React Query:** Perfect for server state management - automatic caching, background refetching, error handling, loading states.

### 2.1 Setup
- Install @tanstack/react-query
- Add QueryClient provider
- Configure default options

### 2.2 Threads Management
- `useThreadsQuery` - Fetch and cache thread list
- `useArchiveThreadMutation` - Archive threads with optimistic updates
- `useCreateThreadMutation` - Create new threads

### 2.3 Messages Management
- `useThreadMessagesQuery` - Fetch messages for specific thread
- `useSaveMessageMutation` - Save messages to memory
- Auto-cache invalidation when needed

### 2.4 Integration
- Replace manual fetchThreads with React Query
- Remove manual loading states (React Query handles this)
- Better error handling with query error states

## 🗃️ Phase 3: Add Zustand for UI State

**Why Zustand:** Lightweight, no boilerplate, great for UI state that doesn't belong on the server.

### 3.1 Store Creation
- Create agent store for UI-only state
- Thread selection state
- Hydration state
- UI flags and preferences

### 3.2 State Migration
- Move threadId from URL state to Zustand (with URL sync)
- Move isHydrated to Zustand
- Keep URL as source of truth but sync to store

### 3.3 Optimized Selectors
- Create specific selectors to prevent re-renders
- `useThreadId()`, `useIsHydrated()` instead of full context

## 🔧 Phase 4: Integration & Optimization

### 4.1 Integration
- Combine React Query + Zustand + existing assistant-ui code
- Ensure proper data flow between all systems
- Maintain backward compatibility

### 4.2 Testing
- Test all user flows (thread switching, messaging, etc.)
- Verify performance improvements
- Check for any regressions

### 4.3 Final Optimization
- React.memo for expensive components
- Optimize re-render patterns
- Clean up any remaining inefficiencies

---

## 🚀 Benefits of This Approach

1. **Incremental:** Each phase builds on the previous, allowing us to catch issues early
2. **Testable:** We can verify functionality after each step
3. **Safe:** Maintains existing functionality while improving architecture
4. **Performance:** Targeted optimizations based on actual pain points
5. **Best Practices:** Modern React patterns with proper separation of concerns

## 📋 Implementation Checklist

### Phase 1: Current Code Cleanup
- [ ] 1.1: Optimize ThreadProvider - reduce re-renders and improve performance
- [ ] 1.2: Clean up useAgentRuntime - simplify complex effects
- [ ] 1.3: Ensure proper provider hierarchy and fix any context issues

### Phase 2: React Query Integration
- [ ] 2.1: Install and setup React Query with provider
- [ ] 2.2: Create hooks for threads fetching and caching
- [ ] 2.3: Create hooks for message fetching and caching
- [ ] 2.4: Replace manual API calls with React Query hooks

### Phase 3: Zustand Integration
- [ ] 3.1: Install Zustand and create store for UI state
- [ ] 3.2: Move thread ID and hydration state to Zustand
- [ ] 3.3: Create optimized selectors to prevent re-renders

### Phase 4: Final Integration
- [ ] 4.1: Integrate React Query + Zustand + existing code
- [ ] 4.2: Test all functionality and fix any issues
- [ ] 4.3: Performance optimization and final cleanup

---

## 🏗️ Current Architecture Analysis

### Current Pain Points
1. **Large context object** in ThreadProvider causes unnecessary re-renders
2. **Manual API state management** with loading/error states
3. **Complex useEffect chains** in useAgentRuntime
4. **Mixed concerns** - server state and UI state in same context

### Target Architecture
```
┌─ React Query ─────────────────┐
│ Server State Management       │
│ - Threads data               │
│ - Messages data              │
│ - API mutations              │
│ - Caching & invalidation     │
└───────────────────────────────┘

┌─ Zustand Store ──────────────┐
│ UI State Management          │
│ - Current thread ID          │
│ - Hydration state           │
│ - UI preferences            │
│ - Optimized selectors       │
└──────────────────────────────┘

┌─ ThreadProvider ─────────────┐
│ Simplified Context           │
│ - Basic configuration       │
│ - Actions/utilities         │
│ - No heavy state           │
└──────────────────────────────┘

┌─ AssistantRuntimeProvider ──┐
│ Assistant UI Context         │
│ - Wraps all UI components   │
│ - Message management        │
│ - Chat runtime              │
└──────────────────────────────┘
```

This approach separates concerns clearly:
- **React Query** = Server state (what should be cached, when to refetch)
- **Zustand** = UI state (user selections, app state)
- **ThreadProvider** = Configuration and utilities
- **AssistantRuntimeProvider** = Assistant UI framework integration