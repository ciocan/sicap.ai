import type { ReactNode } from "react";

import { type CompanyFinancials as CompanyFinancialsData, yoyPercent } from "@sicap/api";
import { cn } from "@sicap/ui";

import { moneyRonCompact } from "@/utils";

import { CompanyFinancialsChart } from "./company-financials-chart";
import { CompanyFinancialsTable } from "./company-financials-table";

function Figure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm">{children}</dd>
    </div>
  );
}

export function CompanyFinancials({ financials }: { financials: CompanyFinancialsData }) {
  const { years, latest } = financials;
  if (years.length === 0 || !latest) {
    return null;
  }

  const prev = years.length >= 2 ? years[years.length - 2] : null;
  const yoy = prev ? yoyPercent(latest.cifraAfaceri, prev.cifraAfaceri) : null;

  return (
    <div className="space-y-6">
      {/* At-a-glance snapshot: the headline figures before the year-by-year detail. */}
      <dl className="flex flex-wrap gap-x-10 gap-y-3">
        <Figure label={`Cifră de afaceri ${latest.an}`}>
          {moneyRonCompact(latest.cifraAfaceri)}
          {yoy !== null && (
            <span
              className={cn(
                "ml-1.5 text-xs",
                yoy < 0 ? "text-destructive" : "text-muted-foreground",
              )}
            >
              ({yoy >= 0 ? "+" : ""}
              {yoy}%)
            </span>
          )}
        </Figure>
        <Figure label="Profit / pierdere">
          <span className={cn(latest.netResult < 0 && "text-destructive")}>
            {moneyRonCompact(latest.netResult)}
          </span>
        </Figure>
        <Figure label="Capitaluri proprii">
          <span className={cn(latest.capitaluri < 0 && "text-destructive")}>
            {moneyRonCompact(latest.capitaluri)}
          </span>
        </Figure>
        <Figure label="Datorii">{moneyRonCompact(latest.datorii)}</Figure>
        {latest.nrSalariati ? (
          <Figure label="Angajați">{latest.nrSalariati.toLocaleString("ro-RO")}</Figure>
        ) : null}
      </dl>

      <CompanyFinancialsChart years={years} />
      <CompanyFinancialsTable years={years} />
    </div>
  );
}
