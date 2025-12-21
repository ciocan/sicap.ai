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
      // Use empty string to prevent cross-iframe localStorage conflicts
      // Note: undefined falls back to default "theme" key, empty string isolates storage
      storageKey=""
    >
      {children}
    </ThemeProvider>
  );
}
