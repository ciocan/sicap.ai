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

interface TopSupplier {
  fiscalNumber: string;
  name: string;
  totalValue: number;
  contractCount: number;
  byIndex: Array<{
    index: string;
    count: number;
    value: number;
  }>;
  byType: Array<{
    type: string;
    count: number;
    value: number;
  }>;
}

interface TopCompaniesChartsProps {
  suppliers: TopSupplier[];
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
  payload?: Array<{ payload: { name: string; totalValue: number; contractCount: number } }>;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium mb-1 max-w-[200px] truncate">{data.name}</p>
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

export function TopCompaniesCharts({ suppliers }: TopCompaniesChartsProps) {
  const barData = useMemo(() => {
    return suppliers.map((supplier) => ({
      name: supplier.name.length > 28 ? `${supplier.name.slice(0, 28)}...` : supplier.name,
      fullName: supplier.name,
      totalValue: supplier.totalValue,
      contractCount: supplier.contractCount,
    }));
  }, [suppliers]);

  const pieData = useMemo(() => {
    const typeAggregation: Record<string, { value: number; count: number }> = {};

    for (const supplier of suppliers) {
      for (const typeItem of supplier.byType) {
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
  }, [suppliers]);

  if (suppliers.length === 0) {
    return null;
  }

  const formatYAxis = (value: number) => {
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
        <h4 className="text-sm font-medium text-muted-foreground">Top firme dupa valoare (RON)</h4>
        <div className="h-[300px] sm:h-[350px]">
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
        <div className="h-[300px] sm:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
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
