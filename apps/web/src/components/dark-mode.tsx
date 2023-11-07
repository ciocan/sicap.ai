"use client";

import { ModeToggle } from "@sicap/ui";
import { captureToggleDarkModeButtonClick } from "@/utils/telemetry";

export function DarkMode() {
  return <ModeToggle position="footer" onCapture={captureToggleDarkModeButtonClick} />;
}
