import { notFound } from "next/navigation";
import { connection } from "next/server";

import {
  getCachedLocalityStats,
  getCachedLocalityTopAuthorities,
  getCachedLocalityTopCompanies,
  getCachedLocalityTopCpv,
  getCachedRelatedLocalities,
} from "@/lib/cached-queries";
import { moneyEur, moneyRon } from "@/utils";
import { LocalityStats } from "./locality-stats";
import { LocalityTabs } from "./locality-tabs";
import { LocalityCpv } from "./locality-cpv";
import { RelatedCities } from "./related-cities";
import { Chart } from "./chart";

interface LocalityContentProps {
  city: string;
  county: string;
  countySlug: string;
}

export async function LocalityContent({ city, county, countySlug }: LocalityContentProps) {
  await connection();
  // Fetch all data in parallel
  const [stats, authorities, companies, cpvCategories, relatedCities] = await Promise.all([
    getCachedLocalityStats({ city, county }).catch(() => null),
    getCachedLocalityTopAuthorities({ city, county, limit: 30 }).catch(() => []),
    getCachedLocalityTopCompanies({ city, county, limit: 30 }).catch(() => []),
    getCachedLocalityTopCpv({ city, county, limit: 10 }).catch(() => []),
    getCachedRelatedLocalities({ county, currentCity: city, limit: 15 }).catch(() => []),
  ]);

  if (!stats) {
    return notFound();
  }

  const totalValueRon = moneyRon(stats.totalValue);
  const totalValueEur = moneyEur(stats.totalValue);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl">
          {city}, {county}
        </h1>
        <p className="text-muted-foreground">
          Achizitii publice in care sunt implicate autoritati contractante sau firme din aceasta
          localitate
        </p>
      </div>

      {/* Summary Statistics */}
      <LocalityStats
        total={stats.total}
        totalValueRon={totalValueRon}
        totalValueEur={totalValueEur}
        uniqueAuthorities={stats.uniqueAuthorities}
        uniqueCompanies={stats.uniqueCompanies}
      />

      {/* Spending Over Time Chart */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Evolutie in timp</h3>
        <Chart stats={stats.stats} />
      </div>

      {/* Tabbed Content - Authorities and Companies */}
      <LocalityTabs authorities={authorities} companies={companies} />

      {/* Top CPV Categories */}
      {cpvCategories.length > 0 && <LocalityCpv categories={cpvCategories} />}

      {/* Related Cities */}
      {relatedCities.length > 0 && (
        <RelatedCities cities={relatedCities} county={county} countySlug={countySlug} />
      )}
    </div>
  );
}
