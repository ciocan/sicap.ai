"use client";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

import { SidebarInset, SidebarProvider } from "@sicap/ui";
import { AppSidebar } from "./app-sidebar";
import { Main } from "./main";
import { env } from "@/lib/env";

export const Agent = () => {
  const chat = useChat({
    transport: new DefaultChatTransport({
      api: `${env.NEXT_PUBLIC_AGENT_API_URL}/api/agents/sicapAgent/stream`,
    }),
  });
  const runtime = useAISDKRuntime(chat);

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
