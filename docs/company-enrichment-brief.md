# Company Page Enrichment — Design Brief (ONRC + MFP)

Enrich `/firma/[nationalId]` with Romanian trade-registry (`onrc`) and Ministry of
Finance financial (`onrc_financials`) data. Outcome of a grilling session; captures the
verified data facts and every resolved decision. Status: **Slice 1 + 2 built (identity, financials, registry details in a tabbed layout).**

## Verified data facts (empirical, not assumed)

- **Join key:** `onrc.cui` and `onrc_financials.cui` are plain numeric strings (e.g. `"2816464"`),
  exactly equal to the route `nationalId` (= `winner.fiscalNumberInt.toString()`). **Direct
  `term` lookup, no RO-prefix / leading-zero transform.**
- **`onrc`** — 4.17M docs, one per *registration* (not per company). `_id` = `cod_inmatriculare`.
  Fields: `cui`, `cod_inmatriculare` (J-number), `euid`, `denumire`, `forma_juridica`,
  `data_inmatriculare`, `adresa{tara,judet,localitate,strada,nr,cod_postal,sector}`,
  `caen_codes[]`, `activitati[]{clasa,versiune,denumire}`, `reprezentanti[]{nume,calitate,
  localitate,judet,tara,data_nastere,localitate_nastere}`, `reprezentanti_if[]`,
  `sucursale[]{cod_fiscal,denumire,tara,tip_unitate}`, `status_codes[]`, `status_labels[]`,
  `is_functiune/is_radiata/is_insolventa/is_faliment/is_dizolvare/is_lichidare/is_state_owned`,
  `cod_unique`, `snapshot` (date, e.g. `2026-05-06`).
- **`onrc_financials`** — 13.3M docs, one per `(cui, an)`. `_id` = `"{cui}:{an}"`. **Coverage
  2008→2024 (up to 17 years/company). Values in WHOLE LEI** (verified: Dedeman 2024
  `cifra_afaceri` = 12,294,042,595 ≈ 12.3 bn lei ✓). Fields: `an`, `caen` (main CAEN that year),
  `segment`, `cifra_afaceri`, `venituri_totale`, `cheltuieli_totale`, `profit_brut`,
  `pierdere_bruta`, `profit_net`, `pierdere_neta`, `active_imobilizate`, `active_circulante`,
  `creante`, `casa_banci`, `stocuri`, `datorii`, `capitaluri`, `capital_subscris`,
  `patrimoniu_regie`, `nr_salariati` (average headcount; **sparse**, omitted in many filings).
- **CUI is NOT unique in `onrc`** — 3.97M distinct CUIs / 4.17M docs (~5% have multiple records:
  relocations, renames, struck-off lineage, plus junk like `"1111111111111"×8`). `cod_unique` is
  **useless** for picking (true on 4.08M/4.17M). Only ~44% of all entities are `is_functiune`.
- The page only renders for companies that already have procurement history, so **enrichment is
  always additive** (no ONRC-only pages via this route).

## Decisions

1. **Primary job:** procurement-first + profile. Contracts/spending stay the hero; add a compact,
   prominent profile up top + deeper financials in a secondary zone. (Avoid portal bloat.)
2. **Multi-registration CUIs:** show the **canonical** record (rule: `is_functiune===true` →
   tie-break latest `data_inmatriculare`; else latest `data_inmatriculare`). When >1 record exists,
   add a collapsible **"Istoric înregistrări"** (former names, J-numbers, status). Financials are
   keyed by CUI alone → all years come back together regardless of registration count.
3. **Identity / source of truth:** H1 = ONRC `denumire` + `forma_juridica`; show CUI, J-number,
   founding date, full registered `adresa`. Fall back to procurement name only when no match. If
   the procurement name differs meaningfully, surface it as "cunoscută şi ca / fostă".
4. **Financials presentation:** headline (latest-year `cifra_afaceri` + net result + YoY %) in the
   profile band; a **"Situație financiară"** section with a multi-year trend chart (turnover + net
   result) + a table of core line items (turnover, net profit/loss, total income/expenses, equity,
   debts, total assets) for the last ~5 years, expanding to all 17.
5. **People (GDPR):** show representative **names + role (`calitate`) only**. **Omit** `data_nastere`
   / `localitate_nastere` from display (data minimization). Birth data may stay server-side for
   future name disambiguation.
6. **Activities/branches:** principal activity prominent (CAEN + `denumire`, derived from latest
   `onrc_financials.caen`, fallback first `activitati`); full CAEN list collapsible; **"Întreprindere
   de stat"** badge when `is_state_owned`; branches (`sucursale`) shown only when non-empty.
7. **Layout:** identity band on top (always visible; includes the registered address with a
   Google Maps link and the legal representatives) → **two tabs separating the sources** (default
   **"Achiziții publice"** / e-licitatie: counts, spending chart, top authorities; **"Date financiare"**
   / ONRC + MFP: financial snapshot, dual-axis trend chart, year table, full CAEN activity list,
   branches, and registration history) → **contracts list kept outside the tabs**, always visible
   below under a "Contracte" heading.
8. **Fetch/cache:** two cached functions, fetched in parallel (`Promise.all`) with the existing
   company query; caching currently **disabled** (matches repo ISR-cost stance; snapshot data is cache-ready to re-enable later); on ES failure return `null` and render
   procurement-only.
9. **Empty states:** no ONRC match → silent fallback to today's behavior (no band, no error).
   Matched but no financials → show profile + one quiet line "Nu există situații financiare
   publicate". Zero/blank years → "—" in table, skipped in trend chart.
10. **Sequencing:** two vertical slices (data layer returns everything in slice 1).

## Status badges

`is_functiune`→"În funcțiune" (positive) · `is_insolventa`→"Insolvență" (warn) ·
`is_faliment`→"Faliment" (danger) · `is_dizolvare`/`is_lichidare`→warn · `is_radiata`→"Radiată"
(muted) · `is_state_owned`→"Întreprindere de stat" (info). Surface extra `status_labels` (e.g.
`urmărire penală`) as secondary badges.

## Number formatting (ro-RO, whole lei)

Headline abbreviated: `≥1e9` → "X,Y mld lei"; `≥1e6` → "X,Y mil. lei"; `≥1e3` → "X mii lei"; else
"X lei". Table: full grouped lei (`12.294.042.595 lei`). Net result = `profit_net` else
`-pierdere_neta`; color/sign accordingly. Negative `capitaluri` flagged (distress).

## Architecture

- `packages/api/src/es/company/get-company-registry.ts` → `getCompanyRegistry(cui)`: `term` on
  `onrc.cui` (size ~20), apply disambiguation, return `{ canonical, history[], statusLabels[] }`
  plus mapped identity/address/activities/reprezentanti/sucursale.
- `packages/api/src/es/company/get-company-financials.ts` → `getCompanyFinancials(cui)`: `term` on
  `onrc_financials.cui`, sort `an` asc (size 20); return normalized `years[]` with derived
  `netResult` and `totalAssets` (`active_imobilizate + active_circulante`).
- Pass-through cache wrappers in `apps/web/src/lib/cached-queries.ts` (caching disabled like its
  siblings; re-enable a daily revalidate when ISR-cost budget allows).
- `apps/web/src/components/company-all.tsx`: `Promise.all([companyQuery, getCompanyRegistry,
  getCompanyFinancials])` wrapped in try/catch → null on failure.
- New components: `company-profile-band.tsx`, `company-financials.tsx` (chart + table, reuse the
  existing `Chart` pattern), `company-registry-details.tsx` (secondary collapsible),
  `company-registration-history.tsx`.

## Slice plan

- **Slice 1 (core):** both API functions + cache; profile band (identity/status/headline);
  "Situație financiară" (chart + bounded table + expand); empty states.
- **Slice 2 (UI-only, same data):** secondary collapsible — administrators, full CAEN list,
  branches, registration history.

## Non-goals (this effort)

Authority-page (`/autoritate`) enrichment · search filters by financials/status · people-graph
linking administrators across companies · embed-widget enrichment · any write-back/correction.

## Risks / open items

- **Production ES key scope:** the app's `ES_API_KEY` (Vercel env) must have `read` on `onrc*`.
  Granted on the local `.env` key during this session — **confirm the prod/Vercel key has the same
  grant**. App needs only `search` (works); `_mapping` is 403 but unused.
- **Local test/prod mismatch:** root `.env` points procurement at `*-test` (small) while `onrc`
  is full prod scale → local CUIs won't cross-match. Verify slice 1 against a known CUI in
  isolation (e.g. `2816464` Dedeman) or on a preview deploy with prod data.
- **Data quality:** junk CUIs, all-zero financial years, multi-registration lineages — handle
  gracefully per decisions 2/9.

## Docs to update on ship (per CLAUDE.md)

`README.md`, `CLAUDE.md` (route/schema note), `docs/architecture.md` (enrichment deep dive).
