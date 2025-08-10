"use client";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { MastraClient } from "@mastra/client-js";

import { SidebarInset, SidebarProvider } from "@sicap/ui";
import { AppSidebar } from "./app-sidebar";
import { useAgentRuntime } from "./use-agent";
import { Main } from "./main";
import { env } from "@/lib/env";

export const mastraClient = new MastraClient({
  baseUrl: env.NEXT_PUBLIC_AGENT_API_URL,
});

export const Agent = () => {
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
};
