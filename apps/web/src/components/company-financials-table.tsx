"use client";

import { useState } from "react";

import type { FinancialYear } from "@sicap/api";
import { cn } from "@sicap/ui";

import { moneyRon } from "@/utils";

const DEFAULT_ROWS = 5;
const EMPTY = "–"; // en dash for unreported values (em dashes are banned in UI copy)

function cell(value: number) {
  return value === 0 ? EMPTY : moneyRon(value);
}

export function CompanyFinancialsTable({ years }: { years: FinancialYear[] }) {
  const [expanded, setExpanded] = useState(false);

  if (years.length === 0) {
    return null;
  }

  const ordered = [...years].reverse(); // most recent first
  const rows = expanded ? ordered : ordered.slice(0, DEFAULT_ROWS);

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-4 font-medium">An</th>
              <th className="py-2 pr-4 text-right font-medium">Angajați</th>
              <th className="py-2 pr-4 text-right font-medium">Cifră de afaceri</th>
              <th className="py-2 pr-4 text-right font-medium">Profit / pierdere</th>
              <th className="py-2 pr-4 text-right font-medium">Venituri</th>
              <th className="py-2 pr-4 text-right font-medium">Cheltuieli</th>
              <th className="py-2 pr-4 text-right font-medium">Capitaluri</th>
              <th className="py-2 pr-4 text-right font-medium">Datorii</th>
              <th className="py-2 text-right font-medium">Active totale</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            {rows.map((year) => (
              <tr key={year.an} className="border-b border-b-slate-100 dark:border-b-slate-800">
                <td className="py-2 pr-4">{year.an}</td>
                <td className="py-2 pr-4 text-right">
                  {year.nrSalariati ? year.nrSalariati.toLocaleString("ro-RO") : EMPTY}
                </td>
                <td className="py-2 pr-4 text-right">{cell(year.cifraAfaceri)}</td>
                <td
                  className={cn("py-2 pr-4 text-right", year.netResult < 0 && "text-destructive")}
                >
                  {cell(year.netResult)}
                </td>
                <td className="py-2 pr-4 text-right">{cell(year.venituriTotale)}</td>
                <td className="py-2 pr-4 text-right">{cell(year.cheltuieliTotale)}</td>
                <td
                  className={cn("py-2 pr-4 text-right", year.capitaluri < 0 && "text-destructive")}
                >
                  {cell(year.capitaluri)}
                </td>
                <td className="py-2 pr-4 text-right">{cell(year.datorii)}</td>
                <td className="py-2 text-right">{cell(year.totalAssets)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ordered.length > DEFAULT_ROWS && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="text-xs text-primary hover:underline"
        >
          {expanded ? "Arată mai puțin" : `Arată toți anii (${ordered.length})`}
        </button>
      )}
    </div>
  );
}
