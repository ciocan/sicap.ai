import { describe, expect, it } from "vitest";

import {
  HARTA_FIRMELOR_ORIGIN,
  MAX_EMBED_HEIGHT,
  MIN_EMBED_HEIGHT,
  hartaFirmelorCompanyUrl,
  hartaFirmelorEmbedUrl,
  isEmbedHeight,
  isEmbeddableCui,
  isTrustedEmbedOrigin,
} from "./harta-firmelor";

describe("isEmbeddableCui", () => {
  it.each(["41897885", "13154222", "14399840", "4267117"])("accepts the real CUI %s", (cui) =>
    expect(isEmbeddableCui(cui)).toBe(true),
  );

  it("accepts a well-formed 4-digit code, which is shape and not existence", () => {
    // "1234" used to sit in the list above under the title "accepts the real
    // CUI", and it is not one: harta-firmelor answers 404 for both
    // /embed/firma/1234/compact/bare and /firma/1234. What it actually tests is
    // the lower end of the shape — 4 digits, no leading zero — which is all
    // isEmbeddableCui ever claims. The predicate is a cheap filter, never a
    // statement that the company exists over there; the four CUIs above are the
    // ones checked against live data.
    expect(isEmbeddableCui("1234")).toBe(true);
  });

  // "666" is the generateStaticParams placeholder in firma/[nationalId]/page.tsx
  // and resolves to a real consortium page here; harta-firmelor 404s it.
  it.each(["666", "1", "99", "ABC123", "RO41897885", "041897885", "", "12345678901"])(
    "rejects the non-CUI %s",
    (id) => expect(isEmbeddableCui(id)).toBe(false),
  );

  it("rejects a CUI carrying anything but digits, including whitespace", () => {
    for (const id of [" 41897885", "41897885 ", "4189 7885", "41897885\n", "4189-7885"]) {
      expect(isEmbeddableCui(id), `${JSON.stringify(id)} must not be embeddable`).toBe(false);
    }
  });
});

describe("the origin", () => {
  it("is harta-firmelor's production host, for the frame and the anchor alike", () => {
    expect(
      HARTA_FIRMELOR_ORIGIN,
      "The anchor is the whole SEO payload of this card, and the frame must not load " +
        "from a preview deployment: previews carry preview auth and preview backing " +
        "services and get redeployed without warning. If this value changed, fix the " +
        "source, not this line.",
    ).toBe("https://harta-firmelor.ro");
  });

  it("trusts, for height messages, exactly the origin the frame is loaded from", () => {
    // A cross-origin frame posts from the host it was loaded from. If the listener
    // ever validated event.origin against some other host, it would drop every
    // message and the card would silently never resize, with the rest of this file
    // still green. Derived from the builder, so the two cannot drift apart.
    const frameOrigin = new URL(hartaFirmelorEmbedUrl("41897885")).origin;
    expect(frameOrigin).toBe(HARTA_FIRMELOR_ORIGIN);
    expect(
      isTrustedEmbedOrigin(frameOrigin),
      "the listener must trust the origin the iframe src actually resolves to",
    ).toBe(true);
  });

  it("refuses every other origin, preview deployments included", () => {
    for (const origin of [
      // The route shipped to production in harta-firmelor v0.18.0, so the frame no
      // longer needs the dev deployment. It is listed here as a REJECTION: a
      // preview host must never be able to resize a box on a production page.
      "https://dev.harta-firmelor.ro",
      "https://harta-firmelor.ro.evil.com",
      "https://evil.harta-firmelor.ro",
      "http://harta-firmelor.ro",
      "https://harta-firmelor.ro:8443",
      "https://harta-firmelor.ro/embed",
      "null",
      "",
    ]) {
      expect(isTrustedEmbedOrigin(origin), `${JSON.stringify(origin)} must not be trusted`).toBe(
        false,
      );
    }
  });
});

describe("the height a posted message may carry", () => {
  it("accepts 89, the height harta's 404 card reports", () => {
    // THE regression test. harta-firmelor answers HTTP 404 for the ~17% of
    // sicap companies its personal-data policy gates (sole traders), and that
    // 404 renders inside the frame as an 89px box reading "Nu publicam o fisa
    // pentru acest cod." Measured in a browser against the production build:
    // `+2809ms CUI 2785906 height 89` (SMOKE-SICAP-AI.md section 3.3).
    //
    // The old floor was 120, so the message was dropped — and harta's reporter
    // dedupes on the last value it posted, so the same 89 was never sent again.
    // The frame kept its placeholder for good: ~710px of empty box on a 390px
    // phone, on one company page in six. Raising the floor back above 89
    // reinstates that, silently, on a fifth of the site.
    expect(isEmbedHeight(89)).toBe(true);
    // And 81, which is what the same 404 box posts at frame widths 574-702 —
    // every phone and tablet band. A floor tuned to clear 89 exactly would have
    // left the defect in place on precisely the viewports where it hurt most.
    expect(isEmbedHeight(81)).toBe(true);
    expect(MIN_EMBED_HEIGHT).toBeLessThanOrEqual(81);
  });

  it("accepts the bounds themselves and refuses a hair outside them", () => {
    expect(isEmbedHeight(MIN_EMBED_HEIGHT)).toBe(true);
    expect(isEmbedHeight(MAX_EMBED_HEIGHT)).toBe(true);
    expect(isEmbedHeight(MIN_EMBED_HEIGHT - 1)).toBe(false);
    expect(isEmbedHeight(MAX_EMBED_HEIGHT + 1)).toBe(false);
  });

  it("still refuses a collapsed box, so a broken embed cannot erase the card", () => {
    for (const value of [0, -1, -800, 39]) {
      expect(isEmbedHeight(value), `${value} must not be adopted as a height`).toBe(false);
    }
  });

  it("refuses anything that is not a finite number", () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, "89", null, undefined, {}, [89]]) {
      expect(isEmbedHeight(value), `${JSON.stringify(value)} must not be adopted`).toBe(false);
    }
  });
});

describe("the two URLs", () => {
  it("frames the strip-less compact variant", () => {
    expect(hartaFirmelorEmbedUrl("41897885")).toBe(
      "https://harta-firmelor.ro/embed/firma/41897885/compact/bare",
    );
  });

  it("links to the indexable company page, never to the embed", () => {
    const href = hartaFirmelorCompanyUrl("41897885");
    expect(href).toBe("https://harta-firmelor.ro/firma/41897885");
    // The whole point of the anchor is that it points at a page a crawler may
    // index. The embed document is noindex,nofollow.
    expect(href).not.toContain("/embed/");
    expect(new URL(href).origin, "the anchor stays on the production host").toBe(
      HARTA_FIRMELOR_ORIGIN,
    );
  });
});
