"use client";
import { AssistantRuntimeProvider } from "@assistant-ui/react";

import { SidebarInset, SidebarProvider } from "@sicap/ui";
import { AppSidebar } from "./app-sidebar";
import { useAgentRuntime } from "./hooks/use-agent";
import { Main } from "./main";
import { ThreadProvider } from "./hooks/thread-context";

function AgentContent() {
  const { runtime } = useAgentRuntime();
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "20rem",
            "--sidebar-width-mobile": "20rem",
          } as React.CSSProperties
        }
      >
        <div className="flex h-dvh w-full pr-0.5">
          <AppSidebar className="bg-secondary/60 dark:border-secondary-foreground/20" />
          <SidebarInset>
            <Main />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
}

interface AgentProps {
  userId?: string;
}

export const Agent = ({ userId }: AgentProps) => {
  return (
    <ThreadProvider resourceId={userId}>
      <AgentContent />
    </ThreadProvider>
  );
};
