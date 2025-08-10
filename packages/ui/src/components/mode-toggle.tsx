"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { JSX } from "react";

import { Button } from "@sicap/ui";

type ModeToggleProps = {
  onCapture: (props: { theme: string | undefined; from?: string }) => void;
  position: string;
};

export function ModeToggle({ onCapture, position }: ModeToggleProps): JSX.Element {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = () => {
    switch (theme) {
      case "light":
        onCapture({ theme: "dark", from: position });
        setTheme("dark");
        break;
      case "dark":
        onCapture({ theme: "light", from: position });
        setTheme("light");
        break;
      default:
        onCapture({ theme: "light", from: position });
        setTheme("light");
        break;
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleThemeChange} className="text-primary">
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
