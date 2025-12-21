import { esClient } from "../config";
import { ES_INDEX_DIRECT, ES_INDEX_OFFLINE, ES_INDEX_PUBLIC } from "../utils";

export interface TopAuthority {
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

interface CompanyTopAuthoritiesArgs {
  nationalId: string;
  limit?: number;
}

interface AuthorityData {
  name: string;
  totalValue: number;
  contractCount: number;
  byIndex: Map<string, { count: number; value: number }>;
  byType: Map<string, { count: number; value: number }>;
}

export async function getCompanyTopAuthorities({
  nationalId,
  limit = 10,
}: CompanyTopAuthoritiesArgs): Promise<TopAuthority[]> {
  if (!nationalId) {
    throw new Error("CUI/CIF este obligatoriu");
  }

  // Calculate date 12 months ago
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  const dateFrom = twelveMonthsAgo.toISOString().split("T")[0];

  // Map to accumulate authority data across indices
  const authoritiesMap = new Map<string, AuthorityData>();

  // Query PUBLIC index (licitatii) - filter by winner fiscalNumberInt, aggregate by authority
  const publicQuery = {
    index: ES_INDEX_PUBLIC,
    body: {
      size: 0,
      query: {
        bool: {
          filter: [
            { match_phrase: { "noticeContracts.items.winner.fiscalNumberInt": nationalId } },
            { range: { "item.noticeStateDate": { gte: dateFrom } } },
          ],
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

  // Query DIRECT index (achizitii directe) - filter by supplier, aggregate by authority
  const directQuery = {
    index: ES_INDEX_DIRECT,
    body: {
      size: 0,
      query: {
        bool: {
          filter: [
            { match_phrase: { "supplier.numericFiscalNumber": nationalId } },
            { range: { "item.publicationDate": { gte: dateFrom } } },
          ],
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

  // Query OFFLINE index (achizitii offline) - filter by supplier, aggregate by authority
  const offlineQuery = {
    index: ES_INDEX_OFFLINE,
    body: {
      size: 0,
      query: {
        bool: {
          filter: [
            { match_phrase: { "supplier.numericFiscalNumber": nationalId } },
            { range: { "item.publicationDate": { gte: dateFrom } } },
          ],
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

  // Execute all queries in parallel
  const [publicResult, directResult, offlineResult] = await Promise.all([
    esClient.search(publicQuery).catch(() => null),
    esClient.search(directQuery).catch(() => null),
    esClient.search(offlineQuery).catch(() => null),
  ]);

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
      if (fiscalNumber === "0") { continue };

      // Extract name from contractingAuthorityNameAndFN (format: "CUI - Name")
      const rawName = bucket.authority_name.buckets[0]?.key || "";
      const name = rawName.includes(" - ") ? rawName.split(" - ").slice(1).join(" - ") : rawName || "Necunoscut";

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
      // For DIRECT, try to use fiscal_number if available, otherwise use entityId
      const fiscalNumber = bucket.fiscal_number?.buckets[0]?.key?.replace(/[^0-9]/g, "") || String(bucket.key);
      if (fiscalNumber === "0" || !fiscalNumber) { continue };

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
      // For OFFLINE, try to use fiscal_number if available, otherwise use entityId
      const fiscalNumber = bucket.fiscal_number?.buckets[0]?.key?.replace(/[^0-9]/g, "") || String(bucket.key);
      if (fiscalNumber === "0" || !fiscalNumber) { continue };

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

