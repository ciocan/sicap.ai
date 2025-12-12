import type { SearchItemDirect, SearchItemPublic, IndexName, SearchItemOffline } from "@sicap/api";
import { getDay, getMonth, getYear } from "@sicap/api";
import { ES_INDEX_DIRECT, ES_INDEX_PUBLIC, ES_INDEX_OFFLINE } from "@sicap/api/dist/es/utils.mjs";
import { Badge } from "@sicap/ui";

import { getIndexSlug, moneyRon } from "@/utils";

interface EmbedListItemProps {
  id: string;
  index: IndexName;
  fields: SearchItemPublic | SearchItemDirect | SearchItemOffline | undefined;
}

const indexConfig = {
  [ES_INDEX_DIRECT]: {
    text: "Achizitie directa",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    borderColor: "border-l-blue-500",
  },
  [ES_INDEX_OFFLINE]: {
    text: "Achizitie Offline",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    borderColor: "border-l-amber-500",
  },
  [ES_INDEX_PUBLIC]: {
    text: "Licitatie publica",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    borderColor: "border-l-emerald-500",
  },
} as const;

export function EmbedListItem({ id, index, fields }: EmbedListItemProps) {
  if (!fields) {
    return null;
  }

  const { date, value, name, code, supplierName } = fields;

  const day = getDay(date);
  const month = getMonth(date);
  const year = getYear(date);

  const indexSlug = getIndexSlug(index);
  const config = indexConfig[index];

  const contractLink = `https://sicap.ai/${indexSlug}/contract/${id}`;
  const ronValue = Number(value);

  return (
    <a
      href={contractLink}
      target="_blank"
      rel="noopener"
      className={`block p-3 rounded-md border border-border hover:bg-accent/50 transition-colors border-l-[2px] ${config.borderColor}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${config.badgeClass}`}
            >
              {config.text}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {day} {month} {year}
            </span>
          </div>
          <p className="text-xs font-medium line-clamp-2 mb-1">
            {code} - {name}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
              {moneyRon(ronValue)}
            </Badge>
            {supplierName && (
              <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                {supplierName}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
