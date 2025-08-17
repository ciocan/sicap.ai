import type { StateCreator } from "zustand";
import type { StoreState } from ".";

// ------------- Agent slice -------------
export interface AgentSlice {
  // UI State
  sidebarCollapsed: boolean;
  
  // Thread State
  isCreatingNewThread: boolean;

  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setIsCreatingNewThread: (isCreating: boolean) => void;
}

// Agent slice creator
export const createAgentSlice: StateCreator<StoreState, [], [], AgentSlice> = (set, _get, _store) => ({
  // Initial state
  sidebarCollapsed: false,
  isCreatingNewThread: false,

  // UI Actions
  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed } as Partial<StoreState>);
  },

  toggleSidebar: () => {
    set((state: StoreState) => ({ 
      sidebarCollapsed: !state.sidebarCollapsed 
    } as Partial<StoreState>));
  },

  // Thread Actions
  setIsCreatingNewThread: (isCreating) => {
    set({ isCreatingNewThread: isCreating } as Partial<StoreState>);
  },
});