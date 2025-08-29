"use client";
import { AssistantRuntimeProvider } from "@assistant-ui/react";

import { SidebarInset, SidebarProvider } from "@sicap/ui";
import { AppSidebar } from "./app-sidebar";
import { useAgentRuntime } from "./hooks/use-agent-mastra";
// import { useAgentRuntime } from "./hooks/use-agent";

import { Main } from "./main";
import { ThreadProvider } from "./hooks/thread-context";

function AgentContent() {
  const { runtime } = useAgentRuntime();
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "24rem",
            "--sidebar-width-mobile": "20rem",
          } as React.CSSProperties
        }
      >
        <div className="flex h-dvh w-full">
          <AppSidebar className="bg-secondary/60 dark:border-secondary-foreground/20" />
          <SidebarInset>
            <Main />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
}

export const Agent = () => {
  return (
    <ThreadProvider agentId="sicapAgent">
      <AgentContent />
    </ThreadProvider>
  );
};
