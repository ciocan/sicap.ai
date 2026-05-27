import { esClient } from "../config";
import { ES_INDEX_ONRC_FINANCIALS } from "../utils";
import { type FinancialYear, normalizeFinancials, type OnrcFinancialDoc } from "./onrc";

export interface CompanyFinancials {
  /** All reported years, oldest first (covers up to 2008→2024). */
  years: FinancialYear[];
  /** Most recent reported year, for the headline figures. */
  latest: FinancialYear | null;
}

/**
 * Fetch a company's MFP financial history by CUI (== the route nationalId).
 * Returns `null` when the company has no published financials or the lookup fails.
 */
export async function getCompanyFinancials(nationalId: string): Promise<CompanyFinancials | null> {
  if (!nationalId) {
    throw new Error("CUI/CIF este obligatoriu");
  }

  const result = await esClient
    .search<OnrcFinancialDoc>({
      index: ES_INDEX_ONRC_FINANCIALS,
      body: {
        size: 30,
        query: { term: { cui: nationalId } },
        sort: [{ an: "asc" }],
      },
    })
    .catch(() => null);

  const docs = (result?.hits?.hits ?? [])
    .map((hit) => hit._source)
    .filter((doc): doc is OnrcFinancialDoc => Boolean(doc));

  if (docs.length === 0) {
    return null;
  }

  const years = normalizeFinancials(docs);
  const latest = years.length > 0 ? years[years.length - 1] : null;

  return JSON.parse(JSON.stringify({ years, latest }));
}
