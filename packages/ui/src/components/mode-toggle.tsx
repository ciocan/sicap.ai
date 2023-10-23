"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@ui/button";

type ModeToggleProps = {
  onCapture: (props: { theme: string | undefined }) => void;
};

export function ModeToggle({ onCapture }: ModeToggleProps): JSX.Element {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = () => {
    onCapture({ theme });
    switch (theme) {
      case "light":
        setTheme("dark");
        break;
      case "dark":
        setTheme("light");
        break;
      default:
        setTheme("light");
        break;
    }
  };

  return (
    <Button variant="outline" size="icon" onClick={handleThemeChange}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
