import { Suspense } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";

import {
  type CompanyRegistry,
  companyRepresentatives,
  formatOnrcAddress,
  getPrincipalActivity,
} from "@sicap/api";
import { Badge } from "@sicap/ui";

import { slugify } from "@/utils";

import { CompanyRepresentativeLinks } from "./company-representative-links";

interface Props {
  registry: CompanyRegistry | null;
  nationalId: string;
  mainCaen?: string;
  fallbackName?: string;
  fallbackCity?: string;
  fallbackCounty?: string;
}

const KNOWN_STATUS = new Set([
  "funcțiune",
  "insolvență",
  "faliment",
  "dizolvare",
  "lichidare",
  "radiată",
]);

type StatusBadge = { label: string; variant: "secondary" | "destructive" };

// Status flags drive canonical badges; any extra status_labels (e.g. "urmărire penală")
// are surfaced as additional adverse badges. The active state is neutral (secondary) —
// the type-coding emerald/blue/amber hues are reserved for procurement type only.
function statusBadges(registry: CompanyRegistry): StatusBadge[] {
  const c = registry.canonical;
  const flags: [boolean | undefined, string, StatusBadge["variant"]][] = [
    [c.is_functiune, "În funcțiune", "secondary"],
    [c.is_insolventa, "Insolvență", "destructive"],
    [c.is_faliment, "Faliment", "destructive"],
    [c.is_dizolvare, "Dizolvare", "destructive"],
    [c.is_lichidare, "Lichidare", "destructive"],
    [c.is_radiata, "Radiată", "destructive"],
  ];
  const badges: StatusBadge[] = flags
    .filter(([on]) => on)
    .map(([, label, variant]) => ({ label, variant }));
  for (const label of registry.statusLabels) {
    if (!KNOWN_STATUS.has(label.toLowerCase())) {
      badges.push({ label, variant: "destructive" });
    }
  }
  return badges;
}

export function CompanyProfileBand({
  registry,
  nationalId,
  mainCaen,
  fallbackName,
  fallbackCity,
  fallbackCounty,
}: Props) {
  const canonical = registry?.canonical;
  const name = canonical?.denumire ?? fallbackName ?? `Firma ${nationalId}`;

  // The locality link stays sourced from procurement (e-licitatie) data: the ONRC
  // `localitate` carries a "Municipiul …" prefix that does not resolve to a /localitate page.
  const localityLink =
    fallbackCity && fallbackCounty
      ? `/localitate/${slugify(fallbackCounty)}/${slugify(fallbackCity)}`
      : null;

  const foundingYear = canonical?.data_inmatriculare?.slice(0, 4);
  const badges = registry ? statusBadges(registry) : [];
  const activity = canonical ? getPrincipalActivity(canonical.activitati, mainCaen) : null;

  const address = formatOnrcAddress(canonical?.adresa);
  const mapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;
  const representatives = canonical ? companyRepresentatives(canonical.reprezentanti) : [];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h1 className="font-semibold text-lg">{name}</h1>
        {canonical?.forma_juridica && (
          <Badge variant="outline" className="font-mono">
            {canonical.forma_juridica}
          </Badge>
        )}
        {canonical?.is_state_owned && <Badge variant="outline">Întreprindere de stat</Badge>}
        {badges.map((badge) => (
          <Badge key={badge.label} variant={badge.variant}>
            {badge.label}
          </Badge>
        ))}
      </div>

      <p className="text-sm text-muted-foreground font-mono">
        CUI {nationalId}
        {canonical?.cod_inmatriculare ? ` · ${canonical.cod_inmatriculare}` : ""}
        {foundingYear ? ` · înființată ${foundingYear}` : ""}
      </p>

      {fallbackCity && (
        <p className="text-sm text-muted-foreground">
          {localityLink ? (
            <Link
              href={localityLink}
              className="hover:text-primary hover:underline"
              target="_blank"
            >
              {fallbackCity}
              {fallbackCounty ? `, ${fallbackCounty}` : ""}
            </Link>
          ) : (
            <>
              {fallbackCity}
              {fallbackCounty ? `, ${fallbackCounty}` : ""}
            </>
          )}
        </p>
      )}

      {activity && (
        <p className="text-sm">
          <span className="text-muted-foreground">Activitate principală: </span>
          <span className="font-mono">{activity.code}</span>
          {activity.name ? ` ${activity.name}` : ""}
        </p>
      )}

      {address && (
        <p className="text-sm text-muted-foreground">
          Sediu social:{" "}
          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary hover:underline"
            >
              <MapPin className="mr-1 -mt-0.5 inline size-3.5" />
              {address}
            </a>
          ) : (
            address
          )}
        </p>
      )}

      {representatives.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {representatives.length > 1 ? "Reprezentanți: " : "Reprezentant: "}
          {representatives.map((rep, index) => (
            <span key={`${rep.nume}-${rep.calitate ?? ""}`}>
              {index > 0 ? ", " : ""}
              <span className="text-foreground">{rep.nume}</span>
              {rep.calitate ? ` (${rep.calitate.toLowerCase()})` : ""}
            </span>
          ))}
        </p>
      )}

      {canonical && (
        <Suspense fallback={null}>
          <CompanyRepresentativeLinks
            reprezentanti={canonical.reprezentanti}
            reprezentantiIf={canonical.reprezentanti_if}
            cui={nationalId}
          />
        </Suspense>
      )}
    </div>
  );
}
