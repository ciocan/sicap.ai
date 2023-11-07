"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@ui/button";

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
    <Button variant="outline" size="sm" onClick={handleThemeChange}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
