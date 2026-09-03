/**
 * One origin, for both the frame and the anchor.
 *
 * They fetch different documents from it and for opposite reasons: the frame
 * loads `/embed/...`, which harta-firmelor serves `noindex, nofollow`, and the
 * anchor points at `/firma/<cui>`, which is the indexable page and the entire
 * SEO payload of this card. Same host, so the height listener and the iframe
 * `src` cannot drift apart.
 *
 * This must never become a preview deployment. A preview carries preview auth
 * and preview backing services, and it can be redeployed out from under a
 * production page without anybody here being told. `harta-firmelor.test.ts`
 * pins the value, and `isTrustedEmbedOrigin` refuses a preview host by name.
 */
export const HARTA_FIRMELOR_ORIGIN = "https://harta-firmelor.ro";

/**
 * The route `nationalId` doubles as the CUI on /firma/[nationalId] (see
 * getCompanyRegistry in @sicap/api). It is not always a real fiscal code:
 * consortium supplier ids ("666"), foreign suppliers and RO-prefixed values
 * also reach the route. harta-firmelor 404s on all of those, so we only embed
 * what is unambiguously a Romanian CUI: 4 to 10 digits, no leading zero.
 *
 * This is a cheap filter, not a claim that the company exists over there. Sole
 * traders (PFA, II, AF) are hidden by their personal-data policy and answer 404
 * with a perfectly well-formed CUI, which is why the card is framed rather than
 * inlined: a frame that refuses costs us a blank box, and the anchor beside it
 * is the part that has to be right.
 */
export function isEmbeddableCui(nationalId: string): boolean {
  return /^[1-9]\d{3,9}$/.test(nationalId);
}

/**
 * The compact card with no strip at the bottom.
 *
 * `/compact` drops the map and the financial chart; `/bare` drops their own
 * "Vezi mai mult" strip. We drop it because that strip lives inside a document
 * they serve as noindex,nofollow, so the link in it passes nothing. Ours is
 * rebuilt in `harta-firmelor-card.tsx`, in HTML we render on the server.
 *
 * Live in production since harta-firmelor v0.18.0 (PR #642 merged `dev` into
 * `main`), which is what allows one origin here instead of two.
 */
export function hartaFirmelorEmbedUrl(cui: string): string {
  return `${HARTA_FIRMELOR_ORIGIN}/embed/firma/${cui}/compact/bare`;
}

export function hartaFirmelorCompanyUrl(cui: string): string {
  return `${HARTA_FIRMELOR_ORIGIN}/firma/${cui}`;
}

/**
 * Does a `message` event's origin belong to the document inside the frame?
 *
 * The single place that answers "which host may resize this box". It stays a
 * named predicate now that there is only one origin to name, for two reasons:
 * the frame runs in a client component the test runner cannot mount (the vitest
 * environment is `node`, no DOM), so this is the only way the check is
 * assertable at all; and it is where a second origin would have to be ADDED
 * rather than inlined into the listener, which is how the check quietly ended up
 * comparing the wrong host once already.
 */
export function isTrustedEmbedOrigin(origin: string): boolean {
  return origin === HARTA_FIRMELOR_ORIGIN;
}

/**
 * The floor is 40 px, and it is a MEASURED value. Do not raise it.
 *
 * harta-firmelor answers a real HTTP 404 for roughly 17% of sicap's companies —
 * the sole traders its own personal-data policy gates. That 404 renders inside
 * the frame as an 89 px box reading "Nu publicam o fisa pentru acest cod.",
 * observed in the browser: `+2809ms CUI 2785906 height 89`
 * (SMOKE-SICAP-AI.md section 3.3).
 *
 * The floor used to be 120, so that message was REFUSED. harta's reporter
 * dedupes on the last value it posted (`if (height === last) return`, their
 * `embed-height-reporter.tsx`), so the 89 was posted once, dropped once, and
 * never sent again: the frame kept its full placeholder permanently — roughly
 * 710 px of empty bordered box around one line of text on a 390 px phone, on
 * one company page in six.
 *
 * The 404 box is not one fixed number either: re-measured across the bands it
 * posts 81 px at frame widths 574-702 and 89 px at 957, so a floor picked to
 * clear 89 exactly would still have dropped the phone and tablet cases.
 *
 * 40 px is below every card height ever measured here (81 is the smallest) and
 * still refuses a collapsed, zero or negative box. Anything above 81 reopens
 * the defect.
 */
export const MIN_EMBED_HEIGHT = 40;
export const MAX_EMBED_HEIGHT = 2000;

/**
 * Is a posted `height` a number this frame may adopt?
 *
 * A predicate for the same reason `isTrustedEmbedOrigin` is one: the listener
 * lives in a client component the runner cannot mount (vitest `environment:
 * "node"`, no DOM), so a predicate is the only form of the check a test can
 * call — and the bound that broke the 404 case was a bare literal inside that
 * unmountable listener, which is exactly why nothing went red for it.
 */
export function isEmbedHeight(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= MIN_EMBED_HEIGHT &&
    value <= MAX_EMBED_HEIGHT
  );
}
