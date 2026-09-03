import { ArrowUpRight } from "lucide-react";

import {
  hartaFirmelorCompanyUrl,
  hartaFirmelorEmbedUrl,
  isEmbeddableCui,
} from "@/lib/harta-firmelor";

import { HartaFirmelorFrame } from "./harta-firmelor-frame";

interface Props {
  /** The route nationalId, which on /firma/[nationalId] is the bare CUI. */
  nationalId: string;
}

/**
 * Trade-registry snapshot from harta-firmelor.ro, on the COMPANY page only.
 *
 * The card itself is framed. The "Vezi mai mult" strip that normally sits under
 * it is rebuilt here instead, in our own server HTML, because the framed
 * document is served `noindex, nofollow`: a link inside it passes nothing to
 * anybody. That is the entire reason the frame asks for the `/bare` variant.
 *
 * NEVER render this on an authority page. The guard is structural rather than
 * conditional: this component is imported only by `company-all.tsx`, which is
 * rendered only by `firma/[nationalId]/page.tsx`, and it is deliberately absent
 * from `components/index.tsx` so no barrel import can carry it somewhere else.
 * `authority-all.tsx` is a separate file with a separate tree.
 *
 * If a Content-Security-Policy is ever added to this app it must allow
 * `frame-src https://harta-firmelor.ro` (HARTA_FIRMELOR_ORIGIN).
 */
export function HartaFirmelorCard({ nationalId }: Props) {
  if (!isEmbeddableCui(nationalId)) {
    return null;
  }

  return (
    <section aria-label="Date din registrul comerțului pe harta-firmelor.ro" className="space-y-4">
      <div className="overflow-hidden rounded-lg border bg-background">
        <HartaFirmelorFrame
          src={hartaFirmelorEmbedUrl(nationalId)}
          title={`Fișa firmei cu CUI ${nationalId} pe harta-firmelor.ro`}
        />
      </div>

      <a
        href={hartaFirmelorCompanyUrl(nationalId)}
        target="_blank"
        rel="noopener"
        className="group flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-4 py-3 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="inline-flex items-center gap-2 text-foreground">
          <svg viewBox="0 0 48 64" aria-hidden="true" className="h-6 w-auto shrink-0">
            <path
              fillRule="evenodd"
              fill="currentColor"
              d="M24 62C21.8 55.8 17.9 50.2 13.5 44.2 8 36.7 4 30.6 4 22 4 10.95 12.95 2 24 2c11.05 0 20 8.95 20 20 0 8.6-4 14.7-9.5 22.2-4.4 6-8.3 11.6-10.5 17.8ZM12 11h6v6h-6Zm9 0h6v6h-6Zm9 0h6v6h-6ZM12 20h6v6h-6Zm9 0h6v6h-6Zm9 0h6v6h-6Z"
            />
            <rect x="21" y="29" width="6" height="10" className="fill-primary" />
          </svg>
          <span className="text-lg font-semibold leading-none tracking-tight">
            harta-firmelor<span className="font-medium text-muted-foreground">.ro</span>
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          Vezi mai mult pe harta-firmelor.ro
          <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </a>
    </section>
  );
}
