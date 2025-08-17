import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

import { type AgentSlice, createAgentSlice } from "./slice.agent";

export type StoreState = AgentSlice;

// Enable devtools only when the Redux DevTools extension is available to avoid
// runtime warnings in production / unsupported browsers.
const isDevtoolsAvailable =
  typeof window !== "undefined" && (window as any).__REDUX_DEVTOOLS_EXTENSION__;

export const useStore = create<StoreState>()(
  devtools(
    (set, get, api) => ({
      ...createAgentSlice(set, get, api),
    }),
    {
      name: "sicap-agent-store",
      enabled: isDevtoolsAvailable,
    },
  ),
);

// ------------ Helper hooks ------------
// UI State
export const useSidebarCollapsed = () => useStore((state) => state.sidebarCollapsed);

// Thread State  
export const useIsCreatingNewThread = () => useStore((state) => state.isCreatingNewThread);

// Actions (using useShallow for stable references)
export const useSidebarActions = () => 
  useStore(
    useShallow((state) => ({
      setSidebarCollapsed: state.setSidebarCollapsed,
      toggleSidebar: state.toggleSidebar,
    }))
  );

export const useSetIsCreatingNewThread = () => useStore((state) => state.setIsCreatingNewThread);