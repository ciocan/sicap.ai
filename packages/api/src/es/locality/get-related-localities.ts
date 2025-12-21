import { esClient } from "../config";
import { ES_INDEX_DIRECT, ES_INDEX_OFFLINE } from "../utils";

export interface RelatedLocality {
  city: string;
  slug: string;
}

interface RelatedLocalitiesArgs {
  county: string;
  currentCity: string;
  limit?: number;
}

// Helper to create URL-friendly slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getRelatedLocalities({
  county,
  currentCity,
  limit = 20,
}: RelatedLocalitiesArgs): Promise<RelatedLocality[]> {
  if (!county) {
    throw new Error("County is required");
  }

  const countyLower = county.toLowerCase();
  const currentCityLower = currentCity.toLowerCase();

  // Query for distinct cities in the county from authority locations
  const query = {
    index: [ES_INDEX_DIRECT, ES_INDEX_OFFLINE],
    body: {
      size: 0,
      query: {
        bool: {
          filter: [
            { match_phrase: { "authority.county": countyLower } },
          ],
        },
      },
      aggs: {
        cities: {
          terms: {
            field: "authority.city.keyword",
            size: limit + 10, // Get extra to filter out current city
            order: { _count: "desc" },
          },
        },
      },
    },
  };

  const result = await esClient.search(query).catch(() => null);

  if (!result?.aggregations) {
    return [];
  }

  const aggs = result.aggregations as {
    cities: {
      buckets: Array<{
        key: string;
        doc_count: number;
      }>;
    };
  };

  // Filter out current city and format results
  const cities = aggs.cities.buckets
    .filter((bucket) => bucket.key.toLowerCase() !== currentCityLower)
    .slice(0, limit)
    .map((bucket) => ({
      city: bucket.key,
      slug: slugify(bucket.key),
    }));

  return cities;
}

