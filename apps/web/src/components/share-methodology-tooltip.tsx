"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@sicap/ui";

export function ShareMethodologyTooltip() {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Cum se calculează valoarea"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors align-middle"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm text-xs leading-relaxed">
          Sumăm doar loturile câștigate ca furnizor principal. La consorții și acorduri-cadru afișăm
          valoarea totală a contractului — cota exactă a fiecărui membru nu poate fi determinată din
          datele SEAP.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
