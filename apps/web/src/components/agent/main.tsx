"use client";
import { PanelLeftOpen } from "lucide-react";

import { SidebarTrigger, useSidebar } from "@sicap/ui";

import { DarkMode } from "@/components/dark-mode";
import { Thread } from "./thread";

export function Main() {
  const { state } = useSidebar();

  return (
    <>
      <header className="flex shrink-0 items-center justify-end gap-2 px-4 absolute right-1 top-2 z-10">
        <DarkMode position="agent-header" />
      </header>
      <SidebarTrigger
        className={`text-primary absolute left-0 top-0 m-2 z-10 cursor-pointer transition-all duration-150 ${
          state === "expanded" ? "-translate-x-12 opacity-0 pointer-events-none" : "translate-x-0"
        }`}
      >
        <PanelLeftOpen className="size-4" />
      </SidebarTrigger>
      <Thread />
    </>
  );
}
