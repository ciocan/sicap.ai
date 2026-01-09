import { Suspense } from "react";
import { connection } from "next/server";
import { ExternalLink, AlertCircle } from "lucide-react";

import { getCachedEmbedAchizitii } from "@/lib/cached-queries";
import { EmbedListItem } from "@/components/embed-list-item";
import { formatNumber } from "@/utils";

interface PageProps {
  searchParams: Promise<{ cui?: string }>;
}

function LoadingState() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-20 rounded-md bg-muted animate-pulse" />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle className="h-10 w-10 text-destructive mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function PoweredByFooter() {
  return (
    <div className="pt-2 border-t border-border">
      <a
        href="https://sicap.ai"
        target="_blank"
        rel="noopener"
        className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>Date oferite de</span>
        <span className="font-semibold text-primary">SICAP.ai</span>
        <ExternalLink className="h-2.5 w-2.5" />
      </a>
    </div>
  );
}

async function EmbedContent({ searchParams }: { searchParams: Promise<{ cui?: string }> }) {
  await connection();
  const { cui } = await searchParams;

  if (!cui) {
    return (
      <div className="space-y-4">
        <ErrorState message="Parametrul 'cui' este obligatoriu. Exemplu: /embed?cui=4267117" />
        <PoweredByFooter />
      </div>
    );
  }

  try {
    const results = await getCachedEmbedAchizitii(cui);
    const { items, authority, total } = results;

    const authorityLink = authority
      ? `https://sicap.ai/autoritate/${authority.fiscalNumber}`
      : `https://sicap.ai/cauta?q=${cui}`;

    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <a
            href={authorityLink}
            target="_blank"
            rel="noopener"
            className="text-sm font-semibold hover:text-primary transition-colors line-clamp-2"
          >
            {authority?.entityName || `Autoritate: ${cui}`}
          </a>
          {authority?.city && authority?.county && (
            <p className="text-xs text-muted-foreground">
              {authority.city}, {authority.county}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{formatNumber(total)} achiziții publice</p>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <EmbedListItem key={item.id} id={item.id} index={item.index} fields={item.fields} />
          ))}
        </div>
        {total > 10 && (
          <a
            href={authorityLink}
            target="_blank"
            rel="noopener"
            className="block text-center text-xs text-primary hover:underline py-2"
          >
            Vezi toate cele {formatNumber(total)} achiziții →
          </a>
        )}
        <PoweredByFooter />
      </div>
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Eroare la încărcarea datelor";
    return (
      <div className="space-y-4">
        <ErrorState message={errorMessage} />
        <PoweredByFooter />
      </div>
    );
  }
}

export default function EmbedPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<LoadingState />}>
      <EmbedContent searchParams={searchParams} />
    </Suspense>
  );
}
