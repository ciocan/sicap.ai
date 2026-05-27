"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { FinancialYear } from "@sicap/api";

import { moneyRon, moneyRonCompact } from "@/utils";

// Axis ticks drop the " lei" suffix (repeated on every tick) to stay narrow; the tooltip
// still shows full values.
const axisTick = (value: number) => moneyRonCompact(Number(value)).replace(/\s*lei$/, "");

const FinancialsTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: FinancialYear }[];
}) => {
  if (active && payload && payload.length) {
    const year = payload[0].payload;
    return (
      <div className="font-mono text-xs bg-slate-50 dark:bg-slate-400 p-1 px-2 rounded-sm text-primary dark:text-secondary space-y-1">
        <p className="pb-1 border-b border-b-slate-200 dark:border-b-slate-500">{year.an}</p>
        <p>Cifră de afaceri: {moneyRon(year.cifraAfaceri)}</p>
        <p className={year.netResult < 0 ? "text-destructive" : undefined}>
          Profit / pierdere: {moneyRon(year.netResult)}
        </p>
      </div>
    );
  }
  return null;
};

export function CompanyFinancialsChart({ years }: { years: FinancialYear[] }) {
  // Skip years with no reported activity so they don't flatten the trend.
  const data = years.filter((year) => year.cifraAfaceri !== 0 || year.netResult !== 0);
  if (data.length < 2) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height={220} className="text-xs">
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="5" opacity={0.3} />
        <XAxis dataKey="an" />
        {/* Left axis carries turnover (bars); the right axis carries net result (line), scaled
            on its own so the much smaller net figures stay legible instead of flattening. */}
        <YAxis yAxisId="left" width={56} tickFormatter={axisTick} />
        <YAxis
          yAxisId="right"
          orientation="right"
          width={56}
          stroke="#2563eb"
          tick={{ fill: "#2563eb" }}
          tickFormatter={axisTick}
        />
        <Bar
          yAxisId="left"
          dataKey="cifraAfaceri"
          name="Cifră de afaceri"
          fill="#94a3b8"
          radius={[2, 2, 0, 0]}
        />
        <Line
          yAxisId="right"
          dataKey="netResult"
          name="Profit / pierdere"
          type="monotone"
          stroke="#2563eb"
          dot={{ r: 2 }}
          activeDot={{ r: 4 }}
        />
        <Tooltip content={FinancialsTooltip} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
