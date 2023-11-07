import { Moon, Sun, LogInIcon, LogOutIcon, User2Icon } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@sicap/ui";
import { captureToggleDarkModeButtonClick } from "@/lib/telemetry";
import { getInitials } from "@/utils";

export function Menu() {
  const { theme, setTheme } = useTheme();
  const session = useSession();
  const isAuthenticated = session.status === "authenticated";

  const handleThemeChange = () => {
    switch (theme) {
      case "light":
        captureToggleDarkModeButtonClick({ theme: "dark", from: "menu" });
        setTheme("dark");
        break;
      case "dark":
        captureToggleDarkModeButtonClick({ theme: "light", from: "menu" });
        setTheme("light");
        break;
      default:
        captureToggleDarkModeButtonClick({ theme: "light", from: "menu" });
        setTheme("light");
        break;
    }
  };

  const handleSignout = () => {
    signOut();
  };

  return (
    <DropdownMenuContent className="w-56">
      {isAuthenticated ? (
        <DropdownMenuLabel className="text-primary/70 flex items-center justify-between">
          <span>{session.data?.user?.name}</span>
          <Avatar className="h-6 w-6">
            <AvatarImage src={session.data.user?.image!} />
            <AvatarFallback className="text-xs">
              {getInitials(session.data.user?.name!)}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuLabel>
      ) : (
        <DropdownMenuLabel className="text-primary/70">Contul meu</DropdownMenuLabel>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        {!isAuthenticated && (
          <DropdownMenuItem asChild className="justify-between">
            <Link href="/autentificare" className="flex w-full justify-between cursor-pointer">
              Autentificare <LogInIcon className="w-[1rem]" />
            </Link>
          </DropdownMenuItem>
        )}
        {isAuthenticated && (
          <>
            {/* <DropdownMenuItem asChild className="justify-between">
              <Link href="/profil" className="flex w-full justify-between cursor-pointer">
                Profil <User2Icon className="w-[1rem]" />
              </Link>
            </DropdownMenuItem> */}
            <DropdownMenuItem
              asChild
              onClick={handleSignout}
              className="flex w-full justify-between cursor-pointer"
            >
              <span>
                Deconectare <LogOutIcon className="w-[1rem]" />
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/despre" className="w-full cursor-pointer">
          Despre
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={handleThemeChange}
        className="items-center justify-between cursor-pointer"
      >
        <span>Schimba interfata</span>
        {theme === "dark" ? (
          <Moon className="h-[1rem] w-[1rem] rotate-90 transition-all dark:rotate-0" />
        ) : (
          <Sun className="h-[1rem] w-[1rem] rotate-90 transition-all dark:rotate-0" />
        )}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
