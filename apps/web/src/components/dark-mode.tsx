"use client";

import { ModeToggle } from "@sicap/ui";
import { captureToggleDarkModeButtonClick } from "@/lib/telemetry";

export function DarkMode({ position }: { position: string }) {
  return <ModeToggle position={position} onCapture={captureToggleDarkModeButtonClick} />;
}
