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
} from "recharts";

import { Label, RadioGroup, RadioGroupItem } from "@sicap/ui";
import { formatNumber, moneyRon } from "@/utils";
import { formatDateAs } from "@sicap/api/dist/utils/date.mjs";

interface StatItem {
  key: string;
  count: number;
  value: number;
}

interface Props {
  stats:
    | {
        years: StatItem[];
        months: StatItem[];
      }
    | undefined;
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const [data] = payload;
    return (
      <div className="font-mono text-xs text-center bg-slate-50 dark:bg-slate-400 p-1 px-2 rounded-sm text-primary dark:text-secondary space-y-1">
        <p className="pb-1 border-b border-b-1 border-b-slate-200 dark:border-b-slate-500">
          {data.payload.key}
        </p>
        <p>{`${formatNumber(data.payload.count)} contracte`}</p>
        <p>{moneyRon(data.payload.value)}</p>
      </div>
    );
  }

  return null;
};

export function Chart({ stats }: Props) {
  if (!stats) {
    return null;
  }

  const [activeChartType, setActiveChartType] = useState("count");
  const [activeInterval, setActiveInterval] = useState("years");
  const [data, setData] = useState<StatItem[]>([]);

  useEffect(() => {
    setData(stats.years.map((y) => ({ ...y, key: formatDateAs(y.key, "YYYY") })));
  }, [stats]);

  const handleChangeChartType = (type) => {
    setActiveChartType(type);
  };

  const handleChangeInterval = (interval) => {
    setActiveInterval(interval);
    setData(
      stats[interval].map((y) => ({
        ...y,
        key: formatDateAs(y.key, interval === "years" ? "YYYY" : "MM/YYYY"),
      })),
    );
  };

  return (
    <div className="pb-2">
      <ResponsiveContainer width="100%" height={200} className="ml-[-0px]">
        <LineChart data={data} className="text-xs">
          <CartesianGrid strokeDasharray="5" opacity={0.3} />
          <XAxis dataKey="key" />
          <YAxis dataKey={activeChartType} />
          <Line dataKey={activeChartType} type="monotone" activeDot={{ r: 4 }} dot={{ r: 2 }} />
          <Tooltip content={CustomTooltip} />
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
