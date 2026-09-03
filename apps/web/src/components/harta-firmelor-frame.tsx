"use client";

import { useEffect, useRef } from "react";

import { isEmbedHeight, isTrustedEmbedOrigin } from "@/lib/harta-firmelor";

/** Their constant, byte for byte. A typo here costs the frame its height. */
const MESSAGE_TYPE = "harta-firmelor:embed-height";

/**
 * MEASURED placeholder heights, not a projection.
 *
 * What they are for: the window between FIRST PAINT and the arrival of the
 * height message. The frame has no intrinsic height, so without them the box
 * would be an iframe default until the message lands and then jump to the real
 * height. That window is real and was measured — the height arrives ~2.3 s
 * after navigation on a warm load (SMOKE-SICAP-AI.md section 3.3).
 *
 * What they are NOT for, despite what this comment used to claim: a reader with
 * JavaScript disabled. There is no such reader here. The whole sicap app paints
 * blank without JavaScript — `/integreaza`, which this change never touches,
 * is equally blank — so nobody ever sees this placeholder as a resting state
 * (SMOKE-SICAP-AI.md section 4, F2). The numbers below are unchanged and still
 * right; only the justification was wrong.
 *
 * READ THE UNITS BEFORE CHANGING THESE. The breakpoints are Tailwind's, so they
 * key off the HOST VIEWPORT width; the measurements are of the FRAME, which is
 * narrower, because sicap's container eats 64 px plus the scrollbar. A 640 px
 * viewport gives the frame 561 px and a 619 px tall card. Reading a frame-width
 * measurement as a viewport width is exactly what produced the earlier
 * 680/380/260, which clipped in all three bands by 80, 238 and 73 px.
 *
 * Slack over the worst measured case is +39/+21/+18/+17/+24 px, taken with the
 * longest company name found (CUI 12199005). The card is the same height in
 * light and dark, so there is no theme branch here.
 *
 * The `md:` step is the 768-1023 band, and it was measured last because it was
 * missed first. Before it, that whole band wore `sm:h-[640px]` while the card is
 * really 362 px there — 278 px of box that appears and then collapses, which is
 * layout shift on a change whose entire justification is SEO. Measured in the
 * browser at host viewports 768/800/900/960/1023: 362/362/346/331/331 px, so the
 * band's worst case is its narrow end, 362 px at 768. 380 px carries it with
 * +18 px of margin, in line with the other bands.
 *
 * The remaining overshoot, measured and deliberate: harta's OWN layout flips
 * from stacked to compact at a FRAME width of 640 px, which on this page is a
 * host viewport of ~706 px, not Tailwind's 768. So viewports 706-767 render the
 * 362 px compact card under `sm:h-[640px]` and still overshoot. Closing that
 * needs an arbitrary `min-[706px]:` variant, and 706 is 640 plus the 66 px this
 * container happens to eat — 64 px of padding plus a 2 px scrollbar. A viewport
 * without that scrollbar crosses at 704, and being 2 px wrong flips the box by
 * 278 px. A stock `md:` is safely inside the compact regime under either
 * assumption. Leave it unless someone measures the inset instead of assuming it.
 *
 * Known and accepted: under a 320 px viewport this clips by roughly 39 px.
 * Closing that would open a 210 px gap on an ordinary 390 px phone, which is
 * the worse trade. Leave it.
 */
const PLACEHOLDER_HEIGHT = "h-[800px] sm:h-[640px] md:h-[380px] lg:h-[350px] xl:h-[260px]";

interface Props {
  src: string;
  title: string;
}

/**
 * The frame, and nothing else.
 *
 * This is the only client component in the pair, on purpose: the anchor that
 * carries the SEO value has to be in the server HTML, so it lives in the server
 * parent and never crosses into here.
 *
 * The card posts its own height because a cross-origin frame cannot be measured
 * from outside. Three conditions before we trust a message, and each one is
 * load-bearing: the ORIGIN must be the one the frame is loaded from, the SOURCE
 * must be this frame and not some other frame on the page, and the height must
 * be a number inside a range. Without the source check any framed third party
 * could resize this box by posting the same shape.
 *
 * Both the origin and the range go through predicates in `@/lib/harta-firmelor`
 * rather than living as literals here. That is not tidiness: the range as a
 * bare literal here read `height < 120`, which silently refused the 89 px box
 * harta returns for a sixth of our companies, and nothing could go red for it.
 *
 * The origin check goes through `isTrustedEmbedOrigin` rather than comparing a
 * constant here, because this component cannot be mounted by the test runner
 * (vitest `environment: "node"`, no DOM) and a predicate is the only form of
 * the check a test can call. It is also the one place a second origin would
 * have to be added, instead of a second literal appearing in this listener. The
 * frame briefly loaded from a different host than the anchor pointed at, and a
 * listener comparing the anchor's origin would have dropped every message with
 * the whole suite green; the predicate is what made that catchable.
 *
 * Measured too: the message arrives TWICE per load, an early pre-settle value
 * and then the real one, and it fires again on every resize. Assigning the
 * height on each valid message is what makes both cases correct. Do not
 * unsubscribe after the first message, and do not make the frame grow-only.
 */
export function HartaFirmelorFrame({ src, title }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isTrustedEmbedOrigin(event.origin)) {
        return;
      }
      const frame = frameRef.current;
      if (!frame || event.source !== frame.contentWindow) {
        return;
      }
      const data = event.data as { type?: unknown; height?: unknown } | null;
      if (!data || data.type !== MESSAGE_TYPE || !isEmbedHeight(data.height)) {
        return;
      }
      frame.style.height = `${Math.ceil(data.height)}px`;
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={frameRef}
      src={src}
      title={title}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      className={`block w-full border-0 ${PLACEHOLDER_HEIGHT}`}
    />
  );
}
