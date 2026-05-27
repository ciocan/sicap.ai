// Pure transforms for ONRC trade-registry data (index `onrc`). No I/O lives here — the
// thin Elasticsearch query wrapper (get-company-registry.ts) feeds raw hits to these
// helpers, which keeps the logic unit-testable from apps/web.

export interface OnrcAddress {
  tara?: string;
  judet?: string;
  localitate?: string;
  strada?: string;
  nr?: string;
  cod_postal?: string;
  sector?: string;
}

export interface OnrcActivity {
  clasa: string;
  versiune?: string;
  denumire: string;
}

export interface OnrcRepresentative {
  nume: string;
  calitate?: string;
  localitate?: string;
  judet?: string;
  tara?: string;
  // Birth fields exist in the index but are intentionally not surfaced to the UI
  // (data minimisation); kept on the raw type for completeness.
  data_nastere?: string;
  localitate_nastere?: string;
}

export interface OnrcBranch {
  cod_fiscal?: string;
  denumire?: string;
  tara?: string;
  tip_unitate?: string;
}

/** Raw document shape from the `onrc` index (one per registration, not per company). */
export interface OnrcRegistration {
  cui: string;
  cod_inmatriculare: string;
  euid?: string;
  denumire: string;
  forma_juridica?: string;
  data_inmatriculare?: string;
  adresa?: OnrcAddress;
  caen_codes?: string[];
  activitati?: OnrcActivity[];
  reprezentanti?: OnrcRepresentative[];
  reprezentanti_if?: OnrcRepresentative[];
  sucursale?: OnrcBranch[];
  status_codes?: string[];
  status_labels?: string[];
  is_functiune?: boolean;
  is_radiata?: boolean;
  is_insolventa?: boolean;
  is_faliment?: boolean;
  is_dizolvare?: boolean;
  is_lichidare?: boolean;
  is_state_owned?: boolean;
  snapshot?: string;
}

/**
 * A CUI can map to several `onrc` registrations (relocations, renames, struck-off
 * lineage). The canonical record — the one that drives the profile header — is the
 * active (is_functiune) registration.
 */
export function pickCanonicalRegistration(docs: OnrcRegistration[]): OnrcRegistration {
  // ISO date strings sort lexicographically == chronologically; missing dates sort last.
  const byDateDesc = (a: OnrcRegistration, b: OnrcRegistration) =>
    (b.data_inmatriculare ?? "").localeCompare(a.data_inmatriculare ?? "");
  const active = docs.filter((d) => d.is_functiune).sort(byDateDesc);
  if (active.length > 0) {
    return active[0];
  }
  return [...docs].sort(byDateDesc)[0];
}

/** Raw document shape from the `onrc_financials` index (one per cui+year, values in lei). */
export interface OnrcFinancialDoc {
  cui: string;
  an: number;
  segment?: string;
  caen?: string;
  cifra_afaceri?: number;
  venituri_totale?: number;
  cheltuieli_totale?: number;
  profit_brut?: number;
  pierdere_bruta?: number;
  profit_net?: number;
  pierdere_neta?: number;
  active_imobilizate?: number;
  active_circulante?: number;
  creante?: number;
  casa_banci?: number;
  stocuri?: number;
  datorii?: number;
  capitaluri?: number;
  capital_subscris?: number;
  patrimoniu_regie?: number;
  /** Average reported headcount for the year. Sparse: omitted in many filings. */
  nr_salariati?: number;
}

/** A single year of financials, normalised for display (all amounts in whole lei). */
export interface FinancialYear {
  an: number;
  cifraAfaceri: number;
  /** profit_net − pierdere_neta: positive in a profit year, negative in a loss year. */
  netResult: number;
  totalAssets: number;
  datorii: number;
  capitaluri: number;
  venituriTotale: number;
  cheltuieliTotale: number;
  caen?: string;
  /** Average headcount (nr_salariati). Undefined when the year's filing omits it. */
  nrSalariati?: number;
}

/** Map raw MFP rows into chronological yearly figures with derived net result + total assets. */
export function normalizeFinancials(docs: OnrcFinancialDoc[]): FinancialYear[] {
  return [...docs]
    .sort((a, b) => a.an - b.an)
    .map((d) => ({
      an: d.an,
      cifraAfaceri: d.cifra_afaceri ?? 0,
      netResult: (d.profit_net ?? 0) - (d.pierdere_neta ?? 0),
      totalAssets: (d.active_imobilizate ?? 0) + (d.active_circulante ?? 0),
      datorii: d.datorii ?? 0,
      capitaluri: d.capitaluri ?? 0,
      venituriTotale: d.venituri_totale ?? 0,
      cheltuieliTotale: d.cheltuieli_totale ?? 0,
      caen: d.caen,
      // Left undefined (not 0) when omitted: a missing filing is not "zero employees".
      nrSalariati: d.nr_salariati,
    }));
}

/**
 * Principal activity: the declared main CAEN (from the latest financial year) mapped to
 * its description, falling back to the first listed activity. Null when none are recorded.
 */
export function getPrincipalActivity(
  activitati: OnrcActivity[] | undefined,
  mainCaen?: string,
): { code: string; name?: string } | null {
  if (!activitati || activitati.length === 0) {
    return null;
  }
  const matched = mainCaen ? activitati.find((a) => a.clasa === mainCaen) : undefined;
  const chosen = matched ?? activitati[0];
  return { code: chosen.clasa, name: chosen.denumire };
}

/** Year-over-year change as a rounded percentage; null when the prior value is non-positive. */
export function yoyPercent(current: number, previous: number): number | null {
  if (!previous || previous <= 0) {
    return null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

// Common Romanian street-type words/abbreviations. When `strada` already starts with one
// we leave it; otherwise we prefix "Str." so a bare name like "ZEFIRULUI" reads correctly.
const STREET_TYPES = new Set([
  "str",
  "strada",
  "stradă",
  "bd",
  "bld",
  "bdul",
  "b-dul",
  "bulevard",
  "bulevardul",
  "cal",
  "calea",
  "ale",
  "aleea",
  "sos",
  "șos",
  "soseaua",
  "șoseaua",
  "spl",
  "splaiul",
  "pta",
  "piata",
  "piața",
  "drm",
  "drumul",
  "intr",
  "intrarea",
  "prel",
  "prelungirea",
  "fundatura",
  "fundătura",
  "varianta",
]);

function withStreetType(strada: string): string {
  const first = strada
    .trim()
    .split(/[\s.]+/)[0]
    ?.toLowerCase();
  return first && STREET_TYPES.has(first) ? strada : `Str. ${strada}`;
}

/** Compose a single-line registered address (sediu social) from ONRC address parts. */
export function formatOnrcAddress(adresa?: OnrcAddress): string | null {
  if (!adresa) {
    return null;
  }
  const strada = adresa.strada?.trim();
  const street = [strada ? withStreetType(strada) : null, adresa.nr ? `nr. ${adresa.nr}` : null]
    .filter((p): p is string => Boolean(p?.trim()))
    .join(" ");
  const parts = [
    street || null,
    adresa.sector ? `sector ${adresa.sector}` : null,
    adresa.localitate,
    adresa.judet,
    adresa.cod_postal,
  ].filter((p): p is string => Boolean(p?.trim()));
  return parts.length > 0 ? parts.join(", ") : null;
}

/** Distinct CAEN activities (deduped by code) for the full activity list. */
export function companyActivities(activitati?: OnrcActivity[]): { code: string; name?: string }[] {
  if (!activitati) {
    return [];
  }
  const seen = new Set<string>();
  const out: { code: string; name?: string }[] = [];
  for (const a of activitati) {
    const code = a.clasa?.trim();
    if (!code || seen.has(code)) {
      continue;
    }
    seen.add(code);
    out.push({ code, name: a.denumire?.trim() || undefined });
  }
  return out;
}

/**
 * Legal representatives reduced to name + role only. Birth data (data_nastere /
 * localitate_nastere) is dropped for data minimisation, and duplicates collapsed.
 */
export function companyRepresentatives(
  reprezentanti?: OnrcRepresentative[],
): { nume: string; calitate?: string }[] {
  if (!reprezentanti) {
    return [];
  }
  const seen = new Set<string>();
  const out: { nume: string; calitate?: string }[] = [];
  for (const r of reprezentanti) {
    const nume = r.nume?.trim();
    if (!nume) {
      continue;
    }
    const calitate = r.calitate?.trim() || undefined;
    const key = `${nume}|${calitate ?? ""}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push({ nume, calitate });
  }
  return out;
}
