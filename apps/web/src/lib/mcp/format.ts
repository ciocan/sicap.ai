import type { IndexName, SearchItemDirect, SearchItemOffline, SearchItemPublic } from "@sicap/api";

export type ContractType = "public" | "direct" | "offline";

type AnyItem = SearchItemPublic | SearchItemDirect | SearchItemOffline;

const TYPE_PATH: Record<ContractType, string> = {
  public: "licitatii",
  direct: "achizitii",
  offline: "achizitii-offline",
};

const DEFAULT_BASE_URL = "https://sicap.ai";

export function clampPerPage(perPage?: number): number {
  if (!perPage || perPage < 1) return 10;
  return Math.min(perPage, 50);
}

export function contractUrl(type: ContractType, id: string): string {
  // Only use process.env.BASE_URL if it looks like a full URL (Vite may inject "/" as base)
  const envBase = (process.env as Record<string, string | undefined>)["BASE_URL"];
  const base = envBase?.startsWith("http") ? envBase : DEFAULT_BASE_URL;
  return `${base}/${TYPE_PATH[type]}/${id}`;
}

export interface CompactRow {
  id: string;
  type: ContractType;
  object: string;
  authority: string;
  supplier: string;
  value: string;
  date: string;
  cpv: string;
  url: string;
}

export function toCompactRow(item: { id: string; index: IndexName; fields: AnyItem }): CompactRow {
  const type = item.index as ContractType;
  const f = item.fields;
  return {
    id: item.id,
    type,
    object: f.cpvCodeAndName || f.name,
    authority: f.contractingAuthorityName,
    supplier: f.supplierName,
    value: f.value,
    date: f.date,
    cpv: f.cpvCode,
    url: contractUrl(type, item.id),
  };
}
