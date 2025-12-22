import Link from "next/link";

import { Badge } from "@sicap/ui";
import { formatNumber, moneyRon } from "@/utils";
import type { LocalityTopCompany } from "@sicap/api";
import { ES_INDEX_DIRECT, ES_INDEX_OFFLINE, ES_INDEX_PUBLIC } from "@sicap/api/dist/es/utils.mjs";

interface LocalityTopCompaniesListProps {
  companies: LocalityTopCompany[];
}

const indexLabels: Record<string, string> = {
  [ES_INDEX_PUBLIC]: "Licitatii",
  [ES_INDEX_DIRECT]: "Achizitii directe",
  [ES_INDEX_OFFLINE]: "Achizitii offline",
};

const typeColors: Record<string, string> = {
  Servicii: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  Lucrari: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Produse: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Necunoscut: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export function LocalityTopCompaniesList({ companies }: LocalityTopCompaniesListProps) {
  if (companies.length === 0) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Nu exista firme</div>;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Lista detaliata</h4>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">#</th>
              <th className="pb-2 pr-4 font-medium">Firma</th>
              <th className="pb-2 pr-4 font-medium text-right">Valoare</th>
              <th className="pb-2 pr-4 font-medium text-right">Contracte</th>
              <th className="pb-2 pr-4 font-medium">Sursa</th>
              <th className="pb-2 font-medium">Tip</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company, index) => (
              <tr
                key={company.fiscalNumber}
                className="border-b border-border/50 hover:bg-muted/50"
              >
                <td className="py-3 pr-4 text-muted-foreground">{index + 1}</td>
                <td className="py-3 pr-4">
                  <Link
                    href={`/firma/${company.fiscalNumber}`}
                    className="text-primary hover:underline font-medium"
                    target="_blank"
                  >
                    {company.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">CUI: {company.fiscalNumber}</div>
                </td>
                <td className="py-3 pr-4 text-right font-mono">{moneyRon(company.totalValue)}</td>
                <td className="py-3 pr-4 text-right font-mono">
                  {formatNumber(company.contractCount)}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-1">
                    {company.byIndex.map((item) => (
                      <Badge
                        key={item.index}
                        variant="outline"
                        className="text-xs whitespace-nowrap"
                      >
                        {indexLabels[item.index] || item.index}: {item.count}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {company.byType.map((item) => (
                      <Badge
                        key={item.type}
                        className={`text-xs whitespace-nowrap ${typeColors[item.type] || typeColors.Necunoscut}`}
                      >
                        {item.type}: {item.count}
                      </Badge>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {companies.map((company, index) => (
          <div key={company.fiscalNumber} className="p-4 rounded-lg border bg-card">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                <Link
                  href={`/firma/${company.fiscalNumber}`}
                  className="text-primary hover:underline font-medium text-sm"
                >
                  {company.name}
                </Link>
              </div>
            </div>

            <div className="text-xs text-muted-foreground mb-3">CUI: {company.fiscalNumber}</div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <div className="text-xs text-muted-foreground">Valoare</div>
                <div className="font-mono text-sm font-medium">{moneyRon(company.totalValue)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Contracte</div>
                <div className="font-mono text-sm font-medium">
                  {formatNumber(company.contractCount)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Sursa</div>
                <div className="flex flex-wrap gap-1">
                  {company.byIndex.map((item) => (
                    <Badge key={item.index} variant="outline" className="text-xs">
                      {indexLabels[item.index] || item.index}: {item.count}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Tip</div>
                <div className="flex flex-wrap gap-1">
                  {company.byType.map((item) => (
                    <Badge
                      key={item.type}
                      className={`text-xs ${typeColors[item.type] || typeColors.Necunoscut}`}
                    >
                      {item.type}: {item.count}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
