"use client";

import { useSearchParams } from "next/navigation";
import { ThemeProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

interface EmbedThemeProviderProps extends Omit<ThemeProviderProps, "forcedTheme"> {
  children: React.ReactNode;
}

export function EmbedThemeProvider({ children, ...props }: EmbedThemeProviderProps) {
  const searchParams = useSearchParams();
  const themeParam = searchParams.get("theme");

  // Only force theme if explicitly set to light or dark
  // Otherwise let system preference work
  const forcedTheme = themeParam === "light" || themeParam === "dark" ? themeParam : undefined;

  return (
    <ThemeProvider
      {...props}
      forcedTheme={forcedTheme}
      // Disable storage to prevent cross-iframe conflicts
      storageKey={undefined}
    >
      {children}
    </ThemeProvider>
  );
}
