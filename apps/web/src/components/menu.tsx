import { Moon, Sun, LogInIcon, LogOutIcon, User2Icon } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@sicap/ui";
import { captureToggleDarkModeButtonClick } from "@/utils/telemetry";

export function Menu() {
  const { theme, setTheme } = useTheme();

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

  return (
    <DropdownMenuContent className="w-56">
      <DropdownMenuLabel className="text-primary/70">Contul meu</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild className="justify-between">
          <Link href="/intra" className="flex w-full justify-between cursor-pointer">
            Intra <LogInIcon className="w-[1rem]" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="justify-between">
          <Link href="/profil" className="flex w-full justify-between cursor-pointer">
            Profil <User2Icon className="w-[1rem]" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/iesi" className="flex w-full justify-between cursor-pointer">
            Ieşi <LogOutIcon className="w-[1rem]" />
          </Link>
        </DropdownMenuItem>
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
