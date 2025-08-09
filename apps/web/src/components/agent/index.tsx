"use client";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  Separator,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@sicap/ui";
import { AppSidebar } from "./app-sidebar";

import { Thread } from "@sicap/ui/components/ui/assistant/thread";
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
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>SICAP AI</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <Thread />
          {/* <WeatherToolUI /> */}
        </SidebarInset>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};
