"use client";
import { useEffect } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useQueryState } from "nuqs";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  Separator,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@sicap/ui";
import { AppSidebar } from "./app-sidebar";

import { Thread } from "@/components/agent/thread";
import { ThreadList } from "@/components/agent/thread-list";
import ToolUIWrapper from "@/components/agent/tool-ui";
import { useMastraRuntime } from "./mastra/use-matra-runtime";

export const Agent = () => {
  const [threadId] = useQueryState("t");
  const resourceId = "1c2ed6f3-0472-453f-95eb-14e92098738d";

  // const runtime = useChatRuntime({
  //   api: "/api/chat",
  // });

  const runtime = useMastraRuntime({
    agentId: "sicapAgent",
    resourceId,
    threadId: threadId ?? "",
    setThreadId: () => {},
  });

  // console.log("runtime", runtime);

  // return (
  //   <AssistantRuntimeProvider runtime={runtime}>
  //     <div className="grid h-[100dvh] grid-cols-[200px_1fr] gap-x-2 px-4 py-4">
  //       <ThreadList />
  //       <Thread />
  //       <ToolUIWrapper />
  //     </div>
  //   </AssistantRuntimeProvider>
  // );

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
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Build Your Own ChatGPT UX</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Starter Template</BreadcrumbPage>
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
