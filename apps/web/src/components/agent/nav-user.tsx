"use client";
import Link from "next/link";
import { ChevronsUpDown, LogOutIcon, LogInIcon, InfoIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@sicap/ui";
import { useIdentify } from "@/hooks";
import {
  captureSignInMenuClick,
  captureSignOutMenuClick,
  captureAboutMenuClick,
} from "@/lib/telemetry";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, authClient } = useIdentify();

  const handleSignout = () => {
    captureSignOutMenuClick();
    authClient.signOut();
  };

  if (!user) {
    return (
      <Link
        href="/autentificare"
        className="flex w-full gap-2 items-center cursor-pointer"
        onClick={captureSignInMenuClick}
      >
        <LogInIcon className="w-[1rem]" />
        <span>Autentificare</span>
      </Link>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={user.image!} alt={user.name ?? ""} />
                <AvatarFallback className="rounded-full">
                  {user.name?.charAt(0).toUpperCase() ?? "SA"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-lg">{user.name}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage src={user.image!} alt={user.name ?? ""} />
                  <AvatarFallback className="rounded-full">
                    {user.name?.charAt(0).toUpperCase() ?? "SA"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/despre"
                className="w-full cursor-pointer flex items-center gap-2"
                onClick={captureAboutMenuClick}
              >
                <InfoIcon className="w-[1rem]" />
                <span>Despre</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={handleSignout}
                className="flex w-full gap-2 cursor-pointer"
              >
                <LogOutIcon className="w-[1rem]" />
                <span>Deconectare</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
