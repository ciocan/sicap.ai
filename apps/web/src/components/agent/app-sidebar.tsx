import Link from "next/link";
import { PanelLeftClose, HatGlasses } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
  Button,
} from "@sicap/ui";
import { ThreadList } from "./thread-list";
import { NavUser } from "./nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  return (
    <Sidebar {...props}>
      <SidebarHeader className="my-2 dark:border-secondary-foreground/20">
        <div className="flex items-center justify-between">
          <SidebarTrigger
            className={`mr-2 transition-all duration-150 cursor-pointer text-primary ${
              state === "collapsed"
                ? "pointer-events-none translate-x-8 opacity-0"
                : "translate-x-0"
            }`}
          >
            <PanelLeftClose className="size-4" />
          </SidebarTrigger>
          <SidebarMenu>
            <SidebarMenuItem className="mr-2">
              <SidebarMenuButton size="sm" asChild>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/agent" className="">
                    <span className="text-center text-lg pr-4 w-full text-primary flex items-center gap-2 justify-center">
                      <HatGlasses className="size-5" />
                      <span className="flex items-center gap-0">
                        <span className="font-bold">SICAP.</span>
                        <span className="font-normal">agent</span>
                      </span>
                    </span>
                  </Link>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>
      <SidebarContent 
        className="px-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30"
      >
        <ThreadList />
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter className="border-t dark:border-secondary-foreground/20">
        <SidebarMenu>
          <SidebarMenuItem>
            <NavUser />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
