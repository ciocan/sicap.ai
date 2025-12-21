import Link from "next/link";
import { MapPin } from "lucide-react";
import type { RelatedLocality } from "@sicap/api";

interface RelatedCitiesProps {
  cities: RelatedLocality[];
  county: string;
  countySlug: string;
}

export function RelatedCities({ cities, county, countySlug }: RelatedCitiesProps) {
  if (cities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        Alte localitati din {county}
      </h3>

      <div className="flex flex-wrap gap-2">
        {cities.map((city) => (
          <Link
            key={city.slug}
            href={`/localitate/${countySlug}/${city.slug}`}
            className="px-3 py-1.5 text-sm rounded-full border bg-card hover:bg-muted transition-colors"
          >
            {city.city}
          </Link>
        ))}
      </div>
    </div>
  );
}

