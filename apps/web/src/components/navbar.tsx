"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Menu as MenuIcon, UserSquare2 } from "lucide-react";

import { Button, DropdownMenu, DropdownMenuTrigger, Separator, Toaster } from "@sicap/ui";
import { Search } from "@/components/search";
import { Menu } from "./menu";
import { identifyUser } from "@/lib/telemetry";

export function Navbar(): JSX.Element {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const session = useSession();
  const isAuthenticated = session.status === "authenticated";

  useEffect(() => {
    if (session.status === "authenticated") {
      identifyUser(session.data.user.id, session.data.user);
    }
  }, [session]);

  return (
    <>
      <header className="supports-backdrop-blur:bg-secondary/60 sticky top-0 z-50 w-full bg-secondary backdrop-blur">
        <div className="container flex h-14 items-center lg:max-w-7xl">
          <nav className="flex items-center w-full mx-auto justify-between">
            <div className="flex gap-4 items-center sm:w-1/2">
              <Link href="/">
                <h4 className="text-primary">
                  <span className="font-bold">SICAP</span>.ai
                </h4>
              </Link>
              {!isHome && <Search hideButton />}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="text-primary">
                  {isAuthenticated ? <UserSquare2 /> : <MenuIcon />}
                  <span className="sr-only">Meniu</span>
                </Button>
              </DropdownMenuTrigger>
              <Menu />
            </DropdownMenu>
          </nav>
        </div>
      </header>
      <Toaster />
      <Separator />
    </>
  );
}
