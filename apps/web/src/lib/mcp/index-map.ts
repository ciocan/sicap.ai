import { databases, getIndexSlug } from "@/utils";
import type { ContractSlug } from "./format";

export const CONTRACT_SLUGS = ["licitatii", "achizitii", "achizitii-offline"] as const;

/** Map a raw Elasticsearch index name (e.g. ES_INDEX_PUBLIC) to its public slug. */
export function indexToSlug(index: string): ContractSlug | undefined {
  return getIndexSlug(index) as ContractSlug | undefined;
}

/** Map a public slug back to the raw Elasticsearch index name used by searchContracts filters. */
export function slugToIndex(slug: ContractSlug): string | undefined {
  return databases.find((d) => d.slug === slug)?.id;
}
