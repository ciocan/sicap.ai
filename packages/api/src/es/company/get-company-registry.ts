import { esClient } from "../config";
import { ES_INDEX_ONRC } from "../utils";
import { type OnrcRegistration, pickCanonicalRegistration } from "./onrc";

export interface CompanyRegistry {
  /** The record that drives the profile header (active registration, else most recent). */
  canonical: OnrcRegistration;
  /**
   * Other registrations under the same CUI — former names, relocations, struck-off
   * lineage — newest first. Empty when the CUI has a single registration.
   */
  history: OnrcRegistration[];
  /** Distinct status labels across all registrations (e.g. "urmărire penală"). */
  statusLabels: string[];
}

/**
 * Look up a company's ONRC trade-registry data by CUI (== the route nationalId).
 * Returns `null` when the company is not in the registry (foreign suppliers, some PFAs)
 * or the lookup fails — callers render procurement-only in that case.
 */
export async function getCompanyRegistry(nationalId: string): Promise<CompanyRegistry | null> {
  if (!nationalId) {
    throw new Error("CUI/CIF este obligatoriu");
  }

  const result = await esClient
    .search<OnrcRegistration>({
      index: ES_INDEX_ONRC,
      body: {
        size: 20,
        query: { term: { cui: nationalId } },
      },
    })
    .catch(() => null);

  const docs = (result?.hits?.hits ?? [])
    .map((hit) => hit._source)
    .filter((doc): doc is OnrcRegistration => Boolean(doc));

  if (docs.length === 0) {
    return null;
  }

  const canonical = pickCanonicalRegistration(docs);
  const history = docs
    .filter((doc) => doc.cod_inmatriculare !== canonical.cod_inmatriculare)
    .sort((a, b) => (b.data_inmatriculare ?? "").localeCompare(a.data_inmatriculare ?? ""));
  const statusLabels = Array.from(new Set(docs.flatMap((doc) => doc.status_labels ?? [])));

  // Strip ES client internals so the result is serialisable across the RSC boundary.
  return JSON.parse(JSON.stringify({ canonical, history, statusLabels }));
}
