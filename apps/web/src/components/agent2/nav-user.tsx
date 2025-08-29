"use client";
import Link from "next/link";
import { ChevronsUpDown, LogOutIcon, LogInIcon, InfoIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
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
import { capture } from "@/lib/telemetry";
import { getInitials } from "@/utils";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, authClient, isLoading } = useIdentify();
  const router = useRouter();

  const handleSignout = () => {
    capture("agent sign out button clicked");
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/agent");
        },
      },
    });
  };

  const handleSignIn = () => {
    capture("agent sign in button clicked");
    authClient.signIn.social({
      provider: "google",
      callbackURL: "/agent",
    });
  };

  if (isLoading) {
    return (
      <SidebarMenuButton size="lg" className="flex w-full gap-4 items-center cursor-pointer">
        <Loader2 className="w-[1rem] animate-spin" />
      </SidebarMenuButton>
    );
  }

  if (!user) {
    return (
      <SidebarMenuButton
        size="lg"
        className="flex w-full gap-4 items-center cursor-pointer"
        onClick={handleSignIn}
      >
        <LogInIcon className="w-[1rem]" />
        <span>Autentificare</span>
      </SidebarMenuButton>
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
                <AvatarImage src={user.image!} alt={user.name} />
                <AvatarFallback className="rounded-full">{getInitials(user.name)}</AvatarFallback>
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
                  <AvatarImage src={user.image!} alt={user.name} />
                  <AvatarFallback className="rounded-full">{getInitials(user.name)}</AvatarFallback>
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
                onClick={() => capture("agent about menu clicked")}
              >
                <InfoIcon className="w-[1rem]" />
                <span>Despre</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignout}
              className="flex w-full gap-2 cursor-pointer outline-none"
            >
              <LogOutIcon className="w-[1rem]" />
              <span>Deconectare</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
