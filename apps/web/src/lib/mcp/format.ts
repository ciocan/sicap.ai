import type { SearchItemDirect, SearchItemOffline, SearchItemPublic } from "@sicap/api";

export type ContractSlug = "licitatii" | "achizitii" | "achizitii-offline";

type AnyItem = SearchItemPublic | SearchItemDirect | SearchItemOffline;

const DEFAULT_BASE_URL = "https://sicap.ai";

export function clampPerPage(perPage?: number): number {
  if (!perPage || perPage < 1) {
    return 10;
  }
  return Math.min(perPage, 50);
}

export function contractUrl(slug: ContractSlug, id: string): string {
  // Only use process.env.BASE_URL if it looks like a full URL (Vite may inject "/" as base)
  const envBase = (process.env as Record<string, string | undefined>).BASE_URL;
  const base = envBase?.startsWith("http") ? envBase : DEFAULT_BASE_URL;
  return `${base}/${slug}/contract/${id}`;
}

export interface CompactRow {
  id: string;
  type: ContractSlug;
  object: string;
  authority: string;
  supplier: string;
  value: string;
  date: string;
  cpv: string;
  url: string;
}

export function toCompactRow(
  item: { id: string; fields: AnyItem },
  slug: ContractSlug,
): CompactRow {
  const f = item.fields;
  return {
    id: item.id,
    type: slug,
    object: f.cpvCodeAndName || f.name,
    authority: f.contractingAuthorityName,
    supplier: f.supplierName,
    value: f.value,
    date: f.date,
    cpv: f.cpvCode,
    url: contractUrl(slug, item.id),
  };
}
