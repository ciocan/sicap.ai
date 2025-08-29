"use client";

import { SidebarInset, SidebarProvider } from "@sicap/ui";
import { AppSidebar } from "./sidebar";

import { Main } from "./main";

export default function Agent() {
  return (
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
  );
}
