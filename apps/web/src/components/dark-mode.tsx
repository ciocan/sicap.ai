"use client";

import { ModeToggle } from "@sicap/ui";
import { captureToggleDarkModeButtonClick } from "@/lib/telemetry";

export function DarkMode() {
  return <ModeToggle position="footer" onCapture={captureToggleDarkModeButtonClick} />;
}
