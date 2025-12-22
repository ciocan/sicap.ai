import { FileText, Building2, Factory, Banknote } from "lucide-react";
import { formatNumber } from "@/utils";

interface LocalityStatsProps {
  total: number;
  totalValueRon: string;
  totalValueEur: string;
  uniqueAuthorities: number;
  uniqueCompanies: number;
}

// Elasticsearch default max result window is 10,000
const ELASTICSEARCH_MAX_RESULTS = 10000;

function formatNumberWithMax(value: number): string {
  const formatted = formatNumber(value);
  if (value === ELASTICSEARCH_MAX_RESULTS) {
    return `${formatted}+`;
  }
  return formatted;
}

export function LocalityStats({
  total,
  totalValueRon,
  totalValueEur,
  uniqueAuthorities,
  uniqueCompanies,
}: LocalityStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<FileText className="h-5 w-5" />}
        label="Contracte"
        value={formatNumberWithMax(total)}
      />
      <StatCard
        icon={<Banknote className="h-5 w-5" />}
        label="Valoare totala"
        value={totalValueRon}
        subValue={totalValueEur}
      />
      <StatCard
        icon={<Building2 className="h-5 w-5" />}
        label="Autoritati"
        value={formatNumberWithMax(uniqueAuthorities)}
      />
      <StatCard
        icon={<Factory className="h-5 w-5" />}
        label="Firme"
        value={formatNumberWithMax(uniqueCompanies)}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="font-mono text-lg font-semibold text-primary">{value}</div>
      {subValue && <div className="font-mono text-xs text-muted-foreground">{subValue}</div>}
    </div>
  );
}
