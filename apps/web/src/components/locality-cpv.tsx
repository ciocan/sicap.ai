import Link from "next/link";

import { formatNumber, moneyRon } from "@/utils";
import type { LocalityCpvCategory } from "@sicap/api";

interface LocalityCpvProps {
  categories: LocalityCpvCategory[];
}

export function LocalityCpv({ categories }: LocalityCpvProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Top Categorii CPV</h3>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">#</th>
              <th className="pb-2 pr-4 font-medium">Denumire</th>
              <th className="pb-2 pr-4 font-medium text-right">Valoare</th>
              <th className="pb-2 font-medium text-right">Contracte</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category, index) => (
              <tr key={category.code} className="border-b border-border/50 hover:bg-muted/50">
                <td className="py-3 pr-4 text-muted-foreground">{index + 1}</td>
                <td className="py-3 pr-4">
                  <Link
                    href={`/achizitii/cpv/${category.code}`}
                    className="text-primary hover:underline"
                    target="_blank"
                    prefetch={false}
                  >
                    {category.name}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-right font-mono">{moneyRon(category.totalValue)}</td>
                <td className="py-3 text-right font-mono">
                  {formatNumber(category.contractCount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {categories.map((category, index) => (
          <div key={category.code} className="p-4 rounded-lg border bg-card">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
            </div>

            <div className="text-sm font-medium mb-3">
              <Link
                href={`/achizitii/cpv/${category.code}`}
                className="text-primary hover:underline"
                target="_blank"
                prefetch={false}
              >
                {category.name}
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-muted-foreground">Valoare</div>
                <div className="font-mono text-sm font-medium">{moneyRon(category.totalValue)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Contracte</div>
                <div className="font-mono text-sm font-medium">
                  {formatNumber(category.contractCount)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
