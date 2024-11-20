import { Moon, Sun, LogInIcon, LogOutIcon, User2Icon } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
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
import {
  captureAboutMenuClick,
  captureSignInMenuClick,
  captureSignOutMenuClick,
  captureToggleDarkModeButtonClick,
} from "@/lib/telemetry";
import { getInitials } from "@/utils";
import { useFormbricks } from "@/app/formbricks";
import { useIdentify } from "@/hooks";

export function Menu() {
  const { theme, setTheme } = useTheme();
  const formbricks = useFormbricks();
  const { isAuthenticated, userName, userImage } = useIdentify();

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
    captureSignOutMenuClick();
    signOut();
    formbricks?.logout();
  };

  return (
    <DropdownMenuContent className="w-56">
      {isAuthenticated ? (
        <DropdownMenuLabel className="text-primary/70 flex items-center justify-between">
          <span>{userName}</span>
          <Avatar className="h-6 w-6">
            <AvatarImage src={userImage!} />
            <AvatarFallback className="text-xs">{getInitials(userName!)}</AvatarFallback>
          </Avatar>
        </DropdownMenuLabel>
      ) : (
        <DropdownMenuLabel className="text-primary/70">Contul meu</DropdownMenuLabel>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        {!isAuthenticated && (
          <DropdownMenuItem asChild className="justify-between">
            <Link
              href="/autentificare"
              className="flex w-full justify-between cursor-pointer"
              onClick={captureSignInMenuClick}
            >
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
        <Link href="/despre" className="w-full cursor-pointer" onClick={captureAboutMenuClick}>
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
