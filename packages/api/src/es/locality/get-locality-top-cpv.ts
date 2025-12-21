import { esClient } from "../config";
import { ES_INDEX_DIRECT, ES_INDEX_OFFLINE, ES_INDEX_PUBLIC } from "../utils";

export interface LocalityCpvCategory {
  code: string;
  name: string;
  totalValue: number;
  contractCount: number;
}

interface LocalityTopCpvArgs {
  city: string;
  county: string;
  limit?: number;
}

export async function getLocalityTopCpv({
  city,
  county,
  limit = 10,
}: LocalityTopCpvArgs): Promise<LocalityCpvCategory[]> {
  if (!city || !county) {
    throw new Error("City and county are required");
  }

  const cityLower = city.toLowerCase();
  const cpvMap = new Map<string, { name: string; totalValue: number; contractCount: number }>();

  // Query DIRECT index
  const directQuery = {
    index: ES_INDEX_DIRECT,
    body: {
      size: 0,
      query: {
        bool: {
          should: [
            { match_phrase: { "authority.city": cityLower } },
            { match_phrase: { "supplier.city": cityLower } },
          ],
          minimum_should_match: 1,
        },
      },
      aggs: {
        top_cpv: {
          terms: {
            field: "publicDirectAcquisition.cpvCode.localeKey.keyword",
            size: limit * 3,
            order: { total_value: "desc" },
          },
          aggs: {
            total_value: {
              sum: { field: "item.closingValue" },
            },
            cpv_name: {
              terms: {
                field: "item.cpvCode.keyword",
                size: 1,
              },
            },
          },
        },
      },
    },
  };

  // Query OFFLINE index
  const offlineQuery = {
    index: ES_INDEX_OFFLINE,
    body: {
      size: 0,
      query: {
        bool: {
          should: [
            { match_phrase: { "authority.city": cityLower } },
            { match_phrase: { "supplier.city": cityLower } },
          ],
          minimum_should_match: 1,
        },
      },
      aggs: {
        top_cpv: {
          terms: {
            field: "details.cpvCode.localeKey.keyword",
            size: limit * 3,
            order: { total_value: "desc" },
          },
          aggs: {
            total_value: {
              sum: { field: "item.awardedValue" },
            },
            cpv_name: {
              terms: {
                field: "item.cpvCode.keyword",
                size: 1,
              },
            },
          },
        },
      },
    },
  };

  // Query PUBLIC index
  const publicQuery = {
    index: ES_INDEX_PUBLIC,
    body: {
      size: 0,
      query: {
        bool: {
          should: [
            { match_phrase: { "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.city": cityLower } },
            { match_phrase: { "publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.city": cityLower } },
            { match_phrase: { "noticeContracts.items.winner.address.city": cityLower } },
          ],
          minimum_should_match: 1,
        },
      },
      aggs: {
        top_cpv: {
          terms: {
            field: "item.cpvCode.keyword",
            size: limit * 3,
            order: { total_value: "desc" },
          },
          aggs: {
            total_value: {
              sum: { field: "item.ronContractValue" },
            },
            cpv_name: {
              terms: {
                field: "item.cpvCodeAndName.keyword",
                size: 1,
              },
            },
          },
        },
      },
    },
  };

  // Execute all queries in parallel
  const [directResult, offlineResult, publicResult] = await Promise.all([
    esClient.search(directQuery).catch(() => null),
    esClient.search(offlineQuery).catch(() => null),
    esClient.search(publicQuery).catch(() => null),
  ]);

  // Process DIRECT results
  if (directResult?.aggregations) {
    const aggs = directResult.aggregations as {
      top_cpv: {
        buckets: Array<{
          key: string;
          doc_count: number;
          total_value: { value: number };
          cpv_name: { buckets: Array<{ key: string }> };
        }>;
      };
    };

    for (const bucket of aggs.top_cpv.buckets) {
      const code = bucket.key;
      if (!code) { continue; }

      const existing = cpvMap.get(code);
      const name = bucket.cpv_name.buckets[0]?.key || code;
      if (existing) {
        existing.totalValue += bucket.total_value.value;
        existing.contractCount += bucket.doc_count;
      } else {
        cpvMap.set(code, {
          name,
          totalValue: bucket.total_value.value,
          contractCount: bucket.doc_count,
        });
      }
    }
  }

  // Process OFFLINE results
  if (offlineResult?.aggregations) {
    const aggs = offlineResult.aggregations as {
      top_cpv: {
        buckets: Array<{
          key: string;
          doc_count: number;
          total_value: { value: number };
          cpv_name: { buckets: Array<{ key: string }> };
        }>;
      };
    };

    for (const bucket of aggs.top_cpv.buckets) {
      const code = bucket.key;
      if (!code) { continue; }

      const existing = cpvMap.get(code);
      const name = bucket.cpv_name.buckets[0]?.key || code;
      if (existing) {
        existing.totalValue += bucket.total_value.value;
        existing.contractCount += bucket.doc_count;
      } else {
        cpvMap.set(code, {
          name,
          totalValue: bucket.total_value.value,
          contractCount: bucket.doc_count,
        });
      }
    }
  }

  // Process PUBLIC results
  if (publicResult?.aggregations) {
    const aggs = publicResult.aggregations as {
      top_cpv: {
        buckets: Array<{
          key: string;
          doc_count: number;
          total_value: { value: number };
          cpv_name: { buckets: Array<{ key: string }> };
        }>;
      };
    };

    for (const bucket of aggs.top_cpv.buckets) {
      const code = bucket.key;
      if (!code) { continue; }

      const existing = cpvMap.get(code);
      const name = bucket.cpv_name.buckets[0]?.key || code;
      if (existing) {
        existing.totalValue += bucket.total_value.value;
        existing.contractCount += bucket.doc_count;
      } else {
        cpvMap.set(code, {
          name,
          totalValue: bucket.total_value.value,
          contractCount: bucket.doc_count,
        });
      }
    }
  }

  // Convert map to array and sort by total value
  const cpvCategories = Array.from(cpvMap.entries())
    .map(([code, data]) => ({
      code,
      name: data.name,
      totalValue: data.totalValue,
      contractCount: data.contractCount,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, limit);

  return cpvCategories;
}

