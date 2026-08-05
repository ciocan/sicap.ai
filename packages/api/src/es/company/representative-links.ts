// Pure transforms for linking a company's legal representatives to OTHER companies the same
// natural person represents. Matching is on name + date of birth (people share names), so the
// date of birth is used here but never surfaced to the UI. No I/O lives in these helpers — the
// Elasticsearch query wrapper feeds raw hits in, which keeps the matching logic unit-testable.

import { esClient } from "../config";
import { ES_INDEX_DIRECT, ES_INDEX_OFFLINE, ES_INDEX_ONRC, ES_INDEX_PUBLIC } from "../utils";
import type { OnrcRegistration, OnrcRepresentative } from "./onrc";

/** A natural-person representative reduced to a stable cross-company match key. */
export interface PersonKey {
  /** `${normName}|${dob}` — the match key that disambiguates people who share a name. */
  key: string;
  /** Original display name (diacritics intact); safe to render. */
  nume: string;
  /** Normalised name (uppercased, diacritic-folded); the matching half of the key. */
  normName: string;
  /** ISO date of birth — match-only, never rendered (data minimisation). */
  dob: string;
  calitate?: string;
}

/** Uppercase, fold diacritics and collapse whitespace so spelling variants of one name align. */
export function normalizeRepName(nume: string): string {
  return nume
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritic marks (ă, ș, ț, â, î…)
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

// Court-appointed mandates (insolvency practitioners) attach to many unrelated firms by
// profession, so they are noise for a control/ownership signal and are excluded from matching.
// Note: plain "administrator" is an ordinary company role and is deliberately NOT matched.
const COURT_ROLE = /lichidator|administrator\s+judiciar|administrator\s+special/i;

/** True for judicial liquidator / administrator mandates (not ordinary company roles). */
export function isCourtAppointedRole(calitate?: string): boolean {
  return Boolean(calitate && COURT_ROLE.test(calitate));
}

/** A single representative reduced to a PersonKey, or null when it is not a matchable person. */
function toPersonKey(r: OnrcRepresentative): PersonKey | null {
  const nume = r.nume?.trim();
  const dob = r.data_nastere?.trim();
  // Require a date of birth (legal-entity reps have none) and skip court-appointed roles.
  if (!nume || !dob || isCourtAppointedRole(r.calitate)) {
    return null;
  }
  const normName = normalizeRepName(nume);
  return {
    key: `${normName}|${dob}`,
    nume,
    normName,
    dob,
    calitate: r.calitate?.trim() || undefined,
  };
}

/**
 * Natural-person representatives from both `reprezentanti` and `reprezentanti_if`, reduced to
 * deduped match keys. Legal entities (no date of birth) and court-appointed roles are dropped.
 */
export function representativePersonKeys(
  reprezentanti?: OnrcRepresentative[],
  reprezentanti_if?: OnrcRepresentative[],
): PersonKey[] {
  const seen = new Set<string>();
  const out: PersonKey[] = [];
  for (const r of [...(reprezentanti ?? []), ...(reprezentanti_if ?? [])]) {
    const pk = toPersonKey(r);
    if (pk && !seen.has(pk.key)) {
      seen.add(pk.key);
      out.push(pk);
    }
  }
  return out;
}

/**
 * Which of `keys` appear in `doc` — counting a match only when a SINGLE representative element
 * carries both the name and the date of birth. This post-filter keeps results correct whether
 * `reprezentanti` is an `object`- or `nested`-mapped array in Elasticsearch: an `object` mapping
 * would otherwise let a name and a dob from two different people in the same document match.
 */
export function matchedPersonKeys(
  doc: { reprezentanti?: OnrcRepresentative[]; reprezentanti_if?: OnrcRepresentative[] },
  keys: Set<string>,
): Set<string> {
  const matched = new Set<string>();
  for (const r of [...(doc.reprezentanti ?? []), ...(doc.reprezentanti_if ?? [])]) {
    const pk = toPersonKey(r);
    if (pk && keys.has(pk.key)) {
      matched.add(pk.key);
    }
  }
  return matched;
}

/** A representative linked to other companies that have procurement contracts. */
export interface RepresentativeLink {
  /** Internal match key (name + dob); used only to join with displayed reps, never rendered. */
  key: string;
  /** Display name of the representative. */
  nume: string;
  /** Other companies (by CUI) the same person represents that have procurement contracts. */
  companies: { cui: string; denumire: string }[];
}

// Bound the fan-out so a prolific representative cannot trigger an unbounded query.
const ONRC_SCAN_SIZE = 500;
const MAX_CANDIDATE_CUIS = 200;
const MAX_COMPANIES_PER_PERSON = 24;

/** The fields that mark a company (by `cui`) as a supplier/winner in each procurement index. */
function hasTendersShould(cui: string) {
  return [
    { match_phrase: { "supplier.numericFiscalNumber": cui } }, // achiziții directe
    { match_phrase: { "details.noticeEntityAddress.fiscalNumber": cui } }, // achiziții offline
    { match_phrase: { "noticeContracts.items.winner.fiscalNumberInt": cui } }, // licitații (winner)
    { match_phrase: { "noticeContracts.items.winners.fiscalNumberInt": cui } }, // licitații (winners[])
  ];
}

/**
 * For a company's representatives, find OTHER companies the same natural person represents that
 * have procurement contracts. Matching is on name + date of birth (people share names); the date
 * of birth is used only here and is never returned for display.
 *
 * Two Elasticsearch round trips: (1) pull `onrc` registrations that share a representative's date
 * of birth, then post-filter in app so the name and dob must belong to the SAME person; (2) check
 * which of those companies appear as a supplier/winner across the three procurement indices.
 * Degrades to an empty array on any failure — this is enrichment, never load-bearing.
 */
export async function getRepresentativeLinks(
  reprezentanti: OnrcRepresentative[] | undefined,
  reprezentanti_if: OnrcRepresentative[] | undefined,
  currentCui: string,
): Promise<RepresentativeLink[]> {
  const keys = representativePersonKeys(reprezentanti, reprezentanti_if);
  if (keys.length === 0) {
    return [];
  }
  const keySet = new Set(keys.map((k) => k.key));
  const dobs = Array.from(new Set(keys.map((k) => k.dob)));

  try {
    // (1) Registrations that share a representative's date of birth (broad recall by date).
    const onrcResult = await esClient.search<OnrcRegistration>({
      index: ES_INDEX_ONRC,
      body: {
        size: ONRC_SCAN_SIZE,
        query: {
          bool: {
            should: dobs.flatMap((dob) => [
              {
                nested: {
                  path: "reprezentanti",
                  query: { term: { "reprezentanti.data_nastere": dob } },
                  ignore_unmapped: true,
                },
              },
              {
                nested: {
                  path: "reprezentanti_if",
                  query: { term: { "reprezentanti_if.data_nastere": dob } },
                  ignore_unmapped: true,
                },
              },
            ]),
            minimum_should_match: 1,
          },
        },
        _source: [
          "cui",
          "denumire",
          "reprezentanti.nume",
          "reprezentanti.data_nastere",
          "reprezentanti.calitate",
          "reprezentanti_if.nume",
          "reprezentanti_if.data_nastere",
          "reprezentanti_if.calitate",
        ],
      },
    });

    // Attribute each matched company back to the person(s), excluding the company we're on.
    const companiesByKey = new Map<string, Map<string, string>>();
    for (const hit of onrcResult.hits.hits) {
      const src = hit._source;
      if (!src?.cui || src.cui === currentCui) {
        continue;
      }
      for (const matchedKey of Array.from(matchedPersonKeys(src, keySet))) {
        const byCui = companiesByKey.get(matchedKey) ?? new Map<string, string>();
        byCui.set(src.cui, src.denumire ?? src.cui);
        companiesByKey.set(matchedKey, byCui);
      }
    }

    const candidateCuis = Array.from(
      new Set(Array.from(companiesByKey.values()).flatMap((m) => Array.from(m.keys()))),
    ).slice(0, MAX_CANDIDATE_CUIS);
    if (candidateCuis.length === 0) {
      return [];
    }

    // (2) Which candidates actually have procurement contracts (any of the three indices). A
    // `filters` aggregation keyed by CUI reads back each company's presence in one round trip.
    const tendersResult = await esClient.search({
      index: [ES_INDEX_DIRECT, ES_INDEX_OFFLINE, ES_INDEX_PUBLIC],
      body: {
        size: 0,
        query: {
          bool: { should: candidateCuis.flatMap(hasTendersShould), minimum_should_match: 1 },
        },
        aggs: {
          byCui: {
            filters: {
              filters: Object.fromEntries(
                candidateCuis.map((cui) => [
                  cui,
                  { bool: { should: hasTendersShould(cui), minimum_should_match: 1 } },
                ]),
              ),
            },
          },
        },
      },
    });

    const buckets =
      (tendersResult.aggregations?.byCui as { buckets: Record<string, { doc_count: number }> })
        ?.buckets ?? {};
    const cuisWithTenders = new Set(
      Object.entries(buckets)
        .filter(([, b]) => b.doc_count > 0)
        .map(([cui]) => cui),
    );

    // Assemble per-person, in the representatives' display order; drop people with no links.
    const links: RepresentativeLink[] = [];
    for (const k of keys) {
      const byCui = companiesByKey.get(k.key);
      if (!byCui) {
        continue;
      }
      const companies = Array.from(byCui.entries())
        .filter(([cui]) => cuisWithTenders.has(cui))
        .map(([cui, denumire]) => ({ cui, denumire }))
        .sort((a, b) => a.denumire.localeCompare(b.denumire, "ro"))
        .slice(0, MAX_COMPANIES_PER_PERSON);
      if (companies.length > 0) {
        links.push({ key: k.key, nume: k.nume, companies });
      }
    }

    return JSON.parse(JSON.stringify(links));
  } catch {
    return [];
  }
}
