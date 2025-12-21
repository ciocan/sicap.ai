"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

import { moneyRon, formatNumber } from "@/utils";
import type { LocalityTopAuthority } from "@sicap/api";

interface LocalityTopAuthoritiesChartsProps {
  authorities: LocalityTopAuthority[];
}

// Vibrant colors that work well in both light and dark mode
const barColors = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
  "#84cc16", // lime-500
  "#f97316", // orange-500
  "#6366f1", // indigo-500
  "#14b8a6", // teal-500
  "#a855f7", // purple-500
  "#f43f5e", // rose-500
  "#22c55e", // green-500
  "#eab308", // yellow-500
  "#0ea5e9", // sky-500
  "#d946ef", // fuchsia-500
  "#64748b", // slate-500
  "#78716c", // stone-500
  "#71717a", // zinc-500
];

const typeColors: Record<string, string> = {
  Servicii: "#10b981", // emerald-500
  Lucrari: "#3b82f6", // blue-500
  Produse: "#f59e0b", // amber-500
  Necunoscut: "#6b7280", // gray-500
};

const BarTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { fullName: string; totalValue: number; contractCount: number } }>;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium mb-1 max-w-[250px]">{data.fullName}</p>
        <p className="text-muted-foreground">
          Valoare: <span className="font-mono text-foreground">{moneyRon(data.totalValue)}</span>
        </p>
        <p className="text-muted-foreground">
          Contracte:{" "}
          <span className="font-mono text-foreground">{formatNumber(data.contractCount)}</span>
        </p>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; count: number } }>;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium mb-1">{data.name}</p>
        <p className="text-muted-foreground">
          Valoare: <span className="font-mono text-foreground">{moneyRon(data.value)}</span>
        </p>
        <p className="text-muted-foreground">
          Contracte: <span className="font-mono text-foreground">{formatNumber(data.count)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function LocalityTopAuthoritiesCharts({ authorities }: LocalityTopAuthoritiesChartsProps) {
  // Only show top 15 in bar chart for readability
  const barData = useMemo(() => {
    return authorities.slice(0, 15).map((authority) => ({
      name: authority.name.length > 28 ? `${authority.name.slice(0, 28)}...` : authority.name,
      fullName: authority.name,
      totalValue: authority.totalValue,
      contractCount: authority.contractCount,
    }));
  }, [authorities]);

  const pieData = useMemo(() => {
    const typeAggregation: Record<string, { value: number; count: number }> = {};

    for (const authority of authorities) {
      for (const typeItem of authority.byType) {
        if (!typeAggregation[typeItem.type]) {
          typeAggregation[typeItem.type] = { value: 0, count: 0 };
        }
        typeAggregation[typeItem.type].value += typeItem.value;
        typeAggregation[typeItem.type].count += typeItem.count;
      }
    }

    return Object.entries(typeAggregation)
      .map(([name, data]) => ({
        name,
        value: data.value,
        count: data.count,
        fill: typeColors[name] || typeColors.Necunoscut,
      }))
      .sort((a, b) => b.value - a.value);
  }, [authorities]);

  if (authorities.length === 0) {
    return null;
  }

  const formatYAxis = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Horizontal Bar Chart */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          Top autoritati dupa valoare (RON)
        </h4>
        <div className="h-[400px] sm:h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <XAxis type="number" tickFormatter={formatYAxis} className="text-xs" />
              <YAxis
                type="category"
                dataKey="name"
                width={200}
                tick={{ fontSize: 11 }}
                className="text-xs"
              />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="totalValue" radius={[0, 4, 4, 0]}>
                {barData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Distributie dupa tip contract</h4>
        <div className="h-[400px] sm:h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={140}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

