import { esClient } from "../config";
import { ES_INDEX_DIRECT, ES_INDEX_OFFLINE, ES_INDEX_PUBLIC } from "../utils";

export interface LocalityTopAuthority {
  fiscalNumber: string;
  name: string;
  totalValue: number;
  contractCount: number;
  byIndex: Array<{
    index: string;
    count: number;
    value: number;
  }>;
  byType: Array<{
    type: string;
    count: number;
    value: number;
  }>;
}

interface LocalityTopAuthoritiesArgs {
  city: string;
  county: string;
  limit?: number;
}

interface AuthorityData {
  name: string;
  totalValue: number;
  contractCount: number;
  byIndex: Map<string, { count: number; value: number }>;
  byType: Map<string, { count: number; value: number }>;
}

export async function getLocalityTopAuthorities({
  city,
  county,
  limit = 30,
}: LocalityTopAuthoritiesArgs): Promise<LocalityTopAuthority[]> {
  if (!city || !county) {
    throw new Error("City and county are required");
  }

  const cityLower = city.toLowerCase();
  const authoritiesMap = new Map<string, AuthorityData>();

  // Query DIRECT index - authorities based in locality
  const directQuery = {
    index: ES_INDEX_DIRECT,
    body: {
      size: 0,
      query: {
        bool: {
          filter: [{ match_phrase: { "authority.city": cityLower } }],
        },
      },
      aggs: {
        top_authorities: {
          terms: {
            field: "authority.entityId",
            size: limit * 2,
            order: { total_value: "desc" },
          },
          aggs: {
            total_value: {
              sum: { field: "item.closingValue" },
            },
            authority_name: {
              terms: {
                field: "authority.entityName.keyword",
                size: 1,
              },
            },
            fiscal_number: {
              terms: {
                field: "authority.fiscalNumber.keyword",
                size: 1,
              },
            },
            by_type: {
              terms: {
                field: "publicDirectAcquisition.sysAcquisitionContractType.text.keyword",
                size: 10,
              },
              aggs: {
                value: { sum: { field: "item.closingValue" } },
              },
            },
          },
        },
      },
    },
  };

  // Query OFFLINE index - authorities based in locality
  const offlineQuery = {
    index: ES_INDEX_OFFLINE,
    body: {
      size: 0,
      query: {
        bool: {
          filter: [{ match_phrase: { "authority.city": cityLower } }],
        },
      },
      aggs: {
        top_authorities: {
          terms: {
            field: "authority.entityId",
            size: limit * 2,
            order: { total_value: "desc" },
          },
          aggs: {
            total_value: {
              sum: { field: "item.awardedValue" },
            },
            authority_name: {
              terms: {
                field: "authority.entityName.keyword",
                size: 1,
              },
            },
            fiscal_number: {
              terms: {
                field: "authority.fiscalNumber.keyword",
                size: 1,
              },
            },
            by_type: {
              terms: {
                field: "details.sysAcquisitionContractType.text.keyword",
                size: 10,
              },
              aggs: {
                value: { sum: { field: "item.awardedValue" } },
              },
            },
          },
        },
      },
    },
  };

  // Query PUBLIC index - authorities based in locality
  const publicQuery = {
    index: ES_INDEX_PUBLIC,
    body: {
      size: 0,
      query: {
        bool: {
          should: [
            {
              match_phrase: {
                "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.city": cityLower,
              },
            },
            {
              match_phrase: {
                "publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.city":
                  cityLower,
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
      aggs: {
        top_authorities: {
          terms: {
            field: "item.nationalId",
            size: limit * 2,
            order: { total_value: "desc" },
          },
          aggs: {
            total_value: {
              sum: { field: "item.ronContractValue" },
            },
            authority_name: {
              terms: {
                field: "item.contractingAuthorityNameAndFN.keyword",
                size: 1,
              },
            },
            by_type: {
              terms: {
                field: "item.sysAcquisitionContractType.text.keyword",
                size: 10,
              },
              aggs: {
                value: { sum: { field: "item.ronContractValue" } },
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
      top_authorities: {
        buckets: Array<{
          key: number;
          doc_count: number;
          total_value: { value: number };
          authority_name: { buckets: Array<{ key: string }> };
          fiscal_number: { buckets: Array<{ key: string }> };
          by_type: { buckets: Array<{ key: string; doc_count: number; value: { value: number } }> };
        }>;
      };
    };

    for (const bucket of aggs.top_authorities.buckets) {
      const fiscalNumber =
        bucket.fiscal_number?.buckets[0]?.key?.replace(/[^0-9]/g, "") || String(bucket.key);
      if (!fiscalNumber || fiscalNumber === "0") {
        continue;
      }

      const existing = authoritiesMap.get(fiscalNumber);
      if (existing) {
        existing.totalValue += bucket.total_value.value;
        existing.contractCount += bucket.doc_count;
        const indexData = existing.byIndex.get(ES_INDEX_DIRECT) || { count: 0, value: 0 };
        indexData.count += bucket.doc_count;
        indexData.value += bucket.total_value.value;
        existing.byIndex.set(ES_INDEX_DIRECT, indexData);
        for (const typeItem of bucket.by_type.buckets) {
          const typeData = existing.byType.get(typeItem.key) || { count: 0, value: 0 };
          typeData.count += typeItem.doc_count;
          typeData.value += typeItem.value.value;
          existing.byType.set(typeItem.key, typeData);
        }
      } else {
        const byIndex = new Map<string, { count: number; value: number }>();
        byIndex.set(ES_INDEX_DIRECT, { count: bucket.doc_count, value: bucket.total_value.value });
        const byType = new Map<string, { count: number; value: number }>();
        for (const typeItem of bucket.by_type.buckets) {
          byType.set(typeItem.key, { count: typeItem.doc_count, value: typeItem.value.value });
        }
        authoritiesMap.set(fiscalNumber, {
          name: bucket.authority_name.buckets[0]?.key || "Necunoscut",
          totalValue: bucket.total_value.value,
          contractCount: bucket.doc_count,
          byIndex,
          byType,
        });
      }
    }
  }

  // Process OFFLINE results
  if (offlineResult?.aggregations) {
    const aggs = offlineResult.aggregations as {
      top_authorities: {
        buckets: Array<{
          key: number;
          doc_count: number;
          total_value: { value: number };
          authority_name: { buckets: Array<{ key: string }> };
          fiscal_number: { buckets: Array<{ key: string }> };
          by_type: { buckets: Array<{ key: string; doc_count: number; value: { value: number } }> };
        }>;
      };
    };

    for (const bucket of aggs.top_authorities.buckets) {
      const fiscalNumber =
        bucket.fiscal_number?.buckets[0]?.key?.replace(/[^0-9]/g, "") || String(bucket.key);
      if (!fiscalNumber || fiscalNumber === "0") {
        continue;
      }

      const existing = authoritiesMap.get(fiscalNumber);
      if (existing) {
        existing.totalValue += bucket.total_value.value;
        existing.contractCount += bucket.doc_count;
        const indexData = existing.byIndex.get(ES_INDEX_OFFLINE) || { count: 0, value: 0 };
        indexData.count += bucket.doc_count;
        indexData.value += bucket.total_value.value;
        existing.byIndex.set(ES_INDEX_OFFLINE, indexData);
        for (const typeItem of bucket.by_type.buckets) {
          const typeData = existing.byType.get(typeItem.key) || { count: 0, value: 0 };
          typeData.count += typeItem.doc_count;
          typeData.value += typeItem.value.value;
          existing.byType.set(typeItem.key, typeData);
        }
      } else {
        const byIndex = new Map<string, { count: number; value: number }>();
        byIndex.set(ES_INDEX_OFFLINE, { count: bucket.doc_count, value: bucket.total_value.value });
        const byType = new Map<string, { count: number; value: number }>();
        for (const typeItem of bucket.by_type.buckets) {
          byType.set(typeItem.key, { count: typeItem.doc_count, value: typeItem.value.value });
        }
        authoritiesMap.set(fiscalNumber, {
          name: bucket.authority_name.buckets[0]?.key || "Necunoscut",
          totalValue: bucket.total_value.value,
          contractCount: bucket.doc_count,
          byIndex,
          byType,
        });
      }
    }
  }

  // Process PUBLIC results
  if (publicResult?.aggregations) {
    const aggs = publicResult.aggregations as {
      top_authorities: {
        buckets: Array<{
          key: number;
          doc_count: number;
          total_value: { value: number };
          authority_name: { buckets: Array<{ key: string }> };
          by_type: { buckets: Array<{ key: string; doc_count: number; value: { value: number } }> };
        }>;
      };
    };

    for (const bucket of aggs.top_authorities.buckets) {
      const fiscalNumber = String(bucket.key);
      if (fiscalNumber === "0") {
        continue;
      }

      // Extract name from contractingAuthorityNameAndFN (format: "CUI - Name")
      const rawName = bucket.authority_name.buckets[0]?.key || "";
      const name = rawName.includes(" - ")
        ? rawName.split(" - ").slice(1).join(" - ")
        : rawName || "Necunoscut";

      const existing = authoritiesMap.get(fiscalNumber);
      if (existing) {
        existing.totalValue += bucket.total_value.value;
        existing.contractCount += bucket.doc_count;
        const indexData = existing.byIndex.get(ES_INDEX_PUBLIC) || { count: 0, value: 0 };
        indexData.count += bucket.doc_count;
        indexData.value += bucket.total_value.value;
        existing.byIndex.set(ES_INDEX_PUBLIC, indexData);
        for (const typeItem of bucket.by_type.buckets) {
          const typeData = existing.byType.get(typeItem.key) || { count: 0, value: 0 };
          typeData.count += typeItem.doc_count;
          typeData.value += typeItem.value.value;
          existing.byType.set(typeItem.key, typeData);
        }
      } else {
        const byIndex = new Map<string, { count: number; value: number }>();
        byIndex.set(ES_INDEX_PUBLIC, { count: bucket.doc_count, value: bucket.total_value.value });
        const byType = new Map<string, { count: number; value: number }>();
        for (const typeItem of bucket.by_type.buckets) {
          byType.set(typeItem.key, { count: typeItem.doc_count, value: typeItem.value.value });
        }
        authoritiesMap.set(fiscalNumber, {
          name,
          totalValue: bucket.total_value.value,
          contractCount: bucket.doc_count,
          byIndex,
          byType,
        });
      }
    }
  }

  // Convert map to array and sort by total value
  const authorities = Array.from(authoritiesMap.entries())
    .map(([fiscalNumber, data]) => ({
      fiscalNumber,
      name: data.name,
      totalValue: data.totalValue,
      contractCount: data.contractCount,
      byIndex: Array.from(data.byIndex.entries()).map(([index, d]) => ({
        index,
        count: d.count,
        value: d.value,
      })),
      byType: Array.from(data.byType.entries()).map(([type, d]) => ({
        type,
        count: d.count,
        value: d.value,
      })),
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, limit);

  return authorities;
}
