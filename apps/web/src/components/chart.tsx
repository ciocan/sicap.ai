"use client";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

import { Label, RadioGroup, RadioGroupItem } from "@sicap/ui";
import { formatNumber, moneyRon } from "@/utils";
import { formatDateAs } from "@sicap/api/dist/utils/date.mjs";

interface StatItem {
  key: string;
  count: number;
  value: number;
}

interface Stats {
  years: StatItem[];
  months: StatItem[];
}

interface Props {
  stats: Stats | undefined;
  nonAwardedStats?: Stats | undefined;
}

interface ChartDataItem {
  key: string;
  count: number;
  value: number;
  nonAwardedCount?: number;
  nonAwardedValue?: number;
}

function mergeStats(
  awarded: StatItem[],
  nonAwarded: StatItem[] | undefined,
  dateFormat: string,
): ChartDataItem[] {
  const map = new Map<string, ChartDataItem>();

  for (const item of awarded) {
    const key = formatDateAs(item.key, dateFormat);
    map.set(key, { key, count: item.count, value: item.value });
  }

  if (nonAwarded) {
    for (const item of nonAwarded) {
      const key = formatDateAs(item.key, dateFormat);
      const existing = map.get(key);
      if (existing) {
        existing.nonAwardedCount = item.count;
        existing.nonAwardedValue = item.value;
      } else {
        map.set(key, {
          key,
          count: 0,
          value: 0,
          nonAwardedCount: item.count,
          nonAwardedValue: item.value,
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const [data] = payload;
    const hasNonAwarded = data.payload.nonAwardedCount > 0 || data.payload.nonAwardedValue > 0;
    return (
      <div className="font-mono text-xs text-center bg-slate-50 dark:bg-slate-400 p-1 px-2 rounded-sm text-primary dark:text-secondary space-y-1">
        <p className="pb-1 border-b border-b-1 border-b-slate-200 dark:border-b-slate-500">
          {data.payload.key}
        </p>
        <p>{`${formatNumber(data.payload.count)} contracte`}</p>
        <p>{moneyRon(data.payload.value)}</p>
        {hasNonAwarded && (
          <>
            <p className="pt-1 border-t border-t-1 border-t-slate-200 dark:border-t-slate-500 opacity-60">
              {`${formatNumber(data.payload.nonAwardedCount || 0)} neatribuite`}
            </p>
            <p className="opacity-60">{moneyRon(data.payload.nonAwardedValue || 0)}</p>
          </>
        )}
      </div>
    );
  }

  return null;
};

export function Chart({ stats, nonAwardedStats }: Props) {
  const [activeChartType, setActiveChartType] = useState("value");
  const [activeInterval, setActiveInterval] = useState("years");
  const [data, setData] = useState<ChartDataItem[]>([]);

  const hasNonAwarded =
    nonAwardedStats && (nonAwardedStats.years.length > 0 || nonAwardedStats.months.length > 0);

  useEffect(() => {
    if (stats) {
      setData(mergeStats(stats.years, nonAwardedStats?.years, "YYYY"));
    }
  }, [stats, nonAwardedStats]);

  if (!stats) {
    return null;
  }

  const handleChangeChartType = (type) => {
    setActiveChartType(type);
  };

  const handleChangeInterval = (interval) => {
    setActiveInterval(interval);
    const dateFormat = interval === "years" ? "YYYY" : "MM/YYYY";
    setData(mergeStats(stats[interval], nonAwardedStats?.[interval], dateFormat));
  };

  const nonAwardedDataKey = activeChartType === "value" ? "nonAwardedValue" : "nonAwardedCount";

  return (
    <div className="pb-2">
      <ResponsiveContainer width="100%" height={200} className="ml-[-0px]">
        <LineChart data={data} className="text-xs">
          <CartesianGrid strokeDasharray="5" opacity={0.3} />
          <XAxis dataKey="key" />
          <YAxis dataKey={activeChartType} />
          <Line
            dataKey={activeChartType}
            name="atribuite"
            type="monotone"
            activeDot={{ r: 4 }}
            dot={{ r: 2 }}
          />
          {hasNonAwarded && (
            <Line
              dataKey={nonAwardedDataKey}
              name="neatribuite"
              type="monotone"
              stroke="#ef4444"
              strokeDasharray="5 5"
              activeDot={{ r: 3 }}
              dot={{ r: 1.5 }}
              opacity={0.6}
            />
          )}
          <Tooltip content={CustomTooltip} />
          {hasNonAwarded && <Legend />}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex gap-2 items-center justify-center text-xs">
          <span>Tip grafic</span>
          <RadioGroup
            defaultValue={activeChartType}
            className="flex items-center"
            onValueChange={handleChangeChartType}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="value" id="value" />
              <Label htmlFor="value" className="text-xs font-normal cursor-pointer">
                valoare
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="count" id="count" />
              <Label htmlFor="count" className="text-xs font-normal cursor-pointer">
                numar
              </Label>
            </div>
          </RadioGroup>
        </div>
        <div className="flex gap-2 items-center justify-center text-xs">
          <span>Interval</span>
          <RadioGroup
            defaultValue={activeInterval}
            className="flex items-center"
            onValueChange={handleChangeInterval}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="years" id="years" />
              <Label htmlFor="years" className="text-xs font-normal cursor-pointer">
                ani
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="months" id="months" />
              <Label htmlFor="months" className="text-xs font-normal cursor-pointer">
                luni
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}
