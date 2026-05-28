import type { SearchTotalHits } from "@elastic/elasticsearch/lib/api/types";

import { esClient } from "../config";
import {
  ES_INDEX_DIRECT,
  ES_INDEX_OFFLINE,
  ES_INDEX_PUBLIC,
  type Fields,
  fieldsAchizitii,
  fieldsAchizitiiOffline,
  filedsLicitatii,
  transformItem,
  mapBucket,
  RESULTS_PER_PAGE,
} from "../utils";
import type { IndexName, Buckets } from "../types";

interface CompanyInfo {
  entityName: string;
  fiscalNumber: string;
  city: string;
  county: string;
  entityId?: number;
}

interface NoticeContractItem {
  winner?: { fiscalNumberInt?: string; fiscalNumber?: string };
  winners?: Array<{ fiscalNumberInt?: string; fiscalNumber?: string }>;
  contractValue?: number;
}

/**
 * Calculate the total winning value for a company in a licitatii contract.
 * This sums the contractValue of all lots where the company is a winner
 * (either as primary winner or in the winners array).
 */
export function calculateLicitatiiWinningValue(
  noticeContractsItems: NoticeContractItem[] | undefined,
  nationalId: string,
): number {
  if (!noticeContractsItems || !nationalId) {
    return 0;
  }

  return noticeContractsItems.reduce((total, item) => {
    const contractValue = item.contractValue || 0;

    // Check if company is the primary winner
    const isPrimaryWinner =
      item.winner?.fiscalNumberInt?.toString() === nationalId ||
      item.winner?.fiscalNumber === nationalId;

    // Check if company is in the winners array
    const isInWinnersArray = item.winners?.some(
      (w) => w?.fiscalNumberInt?.toString() === nationalId || w?.fiscalNumber === nationalId,
    );

    if (isPrimaryWinner || isInWinnersArray) {
      return total + contractValue;
    }

    return total;
  }, 0);
}

interface CompanyByNationalIdArgs {
  nationalId: string;
  page?: number;
  perPage?: number;
}

export async function getCompanyByNationalId({
  nationalId,
  page = 1,
  perPage = RESULTS_PER_PAGE,
}: CompanyByNationalIdArgs) {
  if (!nationalId) {
    throw new Error("CUI/CIF este obligatoriu");
  }

  // Query all three indices for the given supplier fiscal number
  //
  // NOTE on licitatii value aggregation:
  // For licitatii with multiple lots where the company won only some lots, the aggregation
  // uses item.ronContractValue (total contract value) instead of the sum of won lot values.
  // This is because Painless scripts in ES aggregations can only access doc values,
  // not the nested noticeContracts.items[].contractValue structure.
  // For accurate per-item values, use calculateLicitatiiWinningValue() on the returned items.
  const valueAggScript = `
    // Licitatii publice - use ronContractValue (see NOTE above for lot-based limitation)
    if (doc.containsKey('item.ronContractValue') && doc['item.ronContractValue'].size() > 0) {
      return doc['item.ronContractValue'].value;
    }
    // Achizitii directe - use closingValue
    if (doc.containsKey('item.closingValue') && doc['item.closingValue'].size() > 0) {
      return doc['item.closingValue'].value;
    }
    // Achizitii offline - use awardedValue
    if (doc.containsKey('item.awardedValue') && doc['item.awardedValue'].size() > 0) {
      return doc['item.awardedValue'].value;
    }
    return 0;
  `;

  const dateScript = `
    if (doc.containsKey('item.noticeStateDate') && doc['item.noticeStateDate'].size() > 0) {
      return doc['item.noticeStateDate'].value.getMillis();
    } else if (doc.containsKey('item.publicationDate') && doc['item.publicationDate'].size() > 0) {
      return doc['item.publicationDate'].value.getMillis();
    } else {
      return 0;
    }
  `;

  const searchParams = {
    index: [ES_INDEX_DIRECT, ES_INDEX_OFFLINE, ES_INDEX_PUBLIC],
    body: {
      query: {
        bool: {
          filter: [
            {
              bool: {
                should: [
                  // Achizitii directe - by supplier fiscal number (only awarded)
                  {
                    bool: {
                      filter: [
                        { match_phrase: { _index: ES_INDEX_DIRECT } },
                        { match_phrase: { "supplier.numericFiscalNumber": nationalId } },
                        { term: { "item.sysDirectAcquisitionState.id": 7 } },
                      ],
                    },
                  },
                  // Achizitii offline - by supplier fiscal number (in noticeEntityAddress)
                  {
                    bool: {
                      filter: [
                        { match_phrase: { _index: ES_INDEX_OFFLINE } },
                        {
                          match_phrase: { "details.noticeEntityAddress.fiscalNumber": nationalId },
                        },
                      ],
                    },
                  },
                  // Licitatii publice - by winner fiscal number (only awarded, check both winner and winners array)
                  {
                    bool: {
                      filter: [
                        { match_phrase: { _index: ES_INDEX_PUBLIC } },
                        { term: { "item.sysProcedureState.id": 5 } },
                      ],
                      should: [
                        {
                          match_phrase: {
                            "noticeContracts.items.winner.fiscalNumberInt": nationalId,
                          },
                        },
                        {
                          match_phrase: {
                            "noticeContracts.items.winners.fiscalNumberInt": nationalId,
                          },
                        },
                      ],
                      minimum_should_match: 1,
                    },
                  },
                ],
                minimum_should_match: 1,
              },
            },
          ],
        },
      },
      sort: [
        {
          _script: {
            type: "number",
            script: {
              source: dateScript,
              lang: "painless",
            },
            order: "desc",
          },
        },
      ],
      aggs: {
        months: {
          date_histogram: {
            script: {
              source: dateScript,
              lang: "painless",
            },
            calendar_interval: "month",
          },
          aggs: {
            sales: {
              sum: {
                script: {
                  source: valueAggScript,
                  lang: "painless",
                },
              },
            },
          },
        },
        years: {
          date_histogram: {
            script: {
              source: dateScript,
              lang: "painless",
            },
            calendar_interval: "year",
          },
          aggs: {
            sales: {
              sum: {
                script: {
                  source: valueAggScript,
                  lang: "painless",
                },
              },
            },
          },
        },
      },
      from: (page - 1) * perPage,
      size: perPage,
    },
    fields: [
      ...fieldsAchizitii,
      ...filedsLicitatii,
      ...fieldsAchizitiiOffline,
      // Additional fields for company info extraction (avoiding _source)
      "supplier.entityName",
      "supplier.fiscalNumber",
      "supplier.entityId",
      "details.noticeEntityAddress.organization",
    ],
    _source: false,
  };

  // Query for non-awarded contracts (count + total value)
  const nonAwardedParams = {
    index: [ES_INDEX_DIRECT, ES_INDEX_PUBLIC],
    body: {
      query: {
        bool: {
          filter: [
            {
              bool: {
                should: [
                  // Achizitii directe - not awarded
                  {
                    bool: {
                      filter: [
                        { match_phrase: { _index: ES_INDEX_DIRECT } },
                        { match_phrase: { "supplier.numericFiscalNumber": nationalId } },
                      ],
                      must_not: [{ term: { "item.sysDirectAcquisitionState.id": 7 } }],
                    },
                  },
                  // Licitatii publice - not awarded
                  {
                    bool: {
                      filter: [{ match_phrase: { _index: ES_INDEX_PUBLIC } }],
                      must_not: [{ term: { "item.sysProcedureState.id": 5 } }],
                      should: [
                        {
                          match_phrase: {
                            "noticeContracts.items.winner.fiscalNumberInt": nationalId,
                          },
                        },
                        {
                          match_phrase: {
                            "noticeContracts.items.winners.fiscalNumberInt": nationalId,
                          },
                        },
                      ],
                      minimum_should_match: 1,
                    },
                  },
                ],
                minimum_should_match: 1,
              },
            },
          ],
        },
      },
      size: 0,
      aggs: {
        totalValue: {
          sum: {
            script: {
              source: valueAggScript,
              lang: "painless",
            },
          },
        },
        months: {
          date_histogram: {
            script: {
              source: dateScript,
              lang: "painless",
            },
            calendar_interval: "month",
          },
          aggs: {
            sales: {
              sum: {
                script: {
                  source: valueAggScript,
                  lang: "painless",
                },
              },
            },
          },
        },
        years: {
          date_histogram: {
            script: {
              source: dateScript,
              lang: "painless",
            },
            calendar_interval: "year",
          },
          aggs: {
            sales: {
              sum: {
                script: {
                  source: valueAggScript,
                  lang: "painless",
                },
              },
            },
          },
        },
      },
    },
  };

  const [result, nonAwardedResult] = await Promise.all([
    esClient.search(searchParams),
    esClient.search(nonAwardedParams),
  ]);

  const total = result.hits.total as SearchTotalHits;
  const hits = result.hits.hits;

  if (hits.length === 0) {
    throw new Error(`Nu s-au găsit rezultate pentru CUI: ${nationalId}`);
  }

  const nonAwardedTotal = nonAwardedResult.hits.total as SearchTotalHits;
  const nonAwardedValue =
    (nonAwardedResult.aggregations?.totalValue as { value: number })?.value || 0;

  // Extract company/supplier info from the first result using fields (not _source)
  let company: CompanyInfo | null = null;

  for (const hit of hits) {
    const fields = hit.fields as Fields | undefined;

    // Skip if no fields (defensive check)
    if (!fields) {
      continue;
    }

    if (hit._index === ES_INDEX_DIRECT) {
      // Achizitii directe - supplier info from fields
      const entityName = fields["supplier.entityName"]?.[0] || fields["item.supplier"]?.[0];
      if (entityName) {
        company = {
          entityName: entityName as string,
          fiscalNumber: (fields["supplier.fiscalNumber"]?.[0] ||
            fields["supplier.numericFiscalNumber"]?.[0] ||
            nationalId) as string,
          city: (fields["supplier.city"]?.[0] || "") as string,
          county: (fields["supplier.county"]?.[0] || "") as string,
          entityId: fields["supplier.entityId"]?.[0] as number | undefined,
        };
        break;
      }
    } else if (hit._index === ES_INDEX_OFFLINE) {
      // Achizitii offline - supplier info from fields
      const entityName =
        fields["details.noticeEntityAddress.organization"]?.[0] || fields["item.supplier"]?.[0];
      if (entityName) {
        company = {
          entityName: entityName as string,
          fiscalNumber: (fields["details.noticeEntityAddress.fiscalNumber"]?.[0] ||
            nationalId) as string,
          city: (fields["details.noticeEntityAddress.city"]?.[0] || "") as string,
          county: "",
          entityId: undefined,
        };
        break;
      }
    } else if (hit._index === ES_INDEX_PUBLIC) {
      // Licitatii publice - check both winner and winners array
      // ES fields API returns flattened arrays, so we need to find the matching entry

      // Get all winner fiscal numbers (from both winner and winners)
      const winnerFiscalNumbers = fields["noticeContracts.items.winner.fiscalNumberInt"] || [];
      const winnersFiscalNumbers = fields["noticeContracts.items.winners.fiscalNumberInt"] || [];

      // Check if our nationalId is in the primary winner(s)
      const winnerIndex = winnerFiscalNumbers.findIndex((fn) => fn?.toString() === nationalId);

      if (winnerIndex !== -1) {
        // Found in primary winner - use winner fields
        const winnerNames = fields["noticeContracts.items.winner.name"] || [];
        const winnerCities = fields["noticeContracts.items.winner.address.city"] || [];
        const winnerCounties =
          fields["noticeContracts.items.winner.address.nutsCodeItem.text"] ||
          fields["noticeContracts.items.winner.address.county.text"] ||
          [];
        const winnerEntityIds = fields["noticeContracts.items.winner.entityId"] || [];

        company = {
          entityName: (winnerNames[winnerIndex] || winnerNames[0] || "") as string,
          fiscalNumber: nationalId,
          city: (winnerCities[winnerIndex] || winnerCities[0] || "") as string,
          county: (winnerCounties[winnerIndex] || winnerCounties[0] || "") as string,
          entityId: (winnerEntityIds[winnerIndex] || winnerEntityIds[0]) as number | undefined,
        };
        break;
      }

      // Check if our nationalId is in the winners array
      const winnersIndex = winnersFiscalNumbers.findIndex((fn) => fn?.toString() === nationalId);

      if (winnersIndex !== -1) {
        // Found in winners array - use winners fields
        const winnersNames = fields["noticeContracts.items.winners.name"] || [];
        const winnersCities = fields["noticeContracts.items.winners.address.city"] || [];
        const winnersCounties =
          fields["noticeContracts.items.winners.address.nutsCodeItem.text"] ||
          fields["noticeContracts.items.winners.address.county.text"] ||
          [];
        const winnersEntityIds = fields["noticeContracts.items.winners.entityId"] || [];

        company = {
          entityName: (winnersNames[winnersIndex] || winnersNames[0] || "") as string,
          fiscalNumber: nationalId,
          city: (winnersCities[winnersIndex] || winnersCities[0] || "") as string,
          county: (winnersCounties[winnersIndex] || winnersCounties[0] || "") as string,
          entityId: (winnersEntityIds[winnersIndex] || winnersEntityIds[0]) as number | undefined,
        };
        break;
      }

      // Fallback: use first available winner info if we couldn't find a match
      // (this can happen if the document matched but field extraction differs)
      const fallbackName =
        fields["noticeContracts.items.winner.name"]?.[0] ||
        fields["noticeContracts.items.winners.name"]?.[0];
      if (fallbackName) {
        company = {
          entityName: fallbackName as string,
          fiscalNumber: nationalId,
          city: (fields["noticeContracts.items.winner.address.city"]?.[0] ||
            fields["noticeContracts.items.winners.address.city"]?.[0] ||
            "") as string,
          county: (fields["noticeContracts.items.winner.address.nutsCodeItem.text"]?.[0] ||
            fields["noticeContracts.items.winner.address.county.text"]?.[0] ||
            fields["noticeContracts.items.winners.address.nutsCodeItem.text"]?.[0] ||
            fields["noticeContracts.items.winners.address.county.text"]?.[0] ||
            "") as string,
          entityId: (fields["noticeContracts.items.winner.entityId"]?.[0] ||
            fields["noticeContracts.items.winners.entityId"]?.[0]) as number | undefined,
        };
        break;
      }
    }
  }

  // Build stats from aggregations
  type StatBuckets = {
    years: ReturnType<typeof mapBucket>[];
    months: ReturnType<typeof mapBucket>[];
  };
  let stats: StatBuckets | undefined;
  if (result.aggregations) {
    const years = result.aggregations.years as Buckets;
    const months = result.aggregations.months as Buckets;
    stats = {
      years: years.buckets.map(mapBucket),
      months: months.buckets.map(mapBucket),
    };
  }

  let nonAwardedStats: StatBuckets | undefined;
  if (nonAwardedResult.aggregations) {
    const years = nonAwardedResult.aggregations.years as Buckets;
    const months = nonAwardedResult.aggregations.months as Buckets;
    nonAwardedStats = {
      years: years.buckets.map(mapBucket),
      months: months.buckets.map(mapBucket),
    };
  }

  const items = hits.map((hit) => ({
    id: hit._id as string,
    index: hit._index as IndexName,
    fields: transformItem(hit._index, (hit.fields || {}) as Fields, {} as Fields, {
      supplierFiscalNumber: nationalId,
    }),
  }));

  const result_data = {
    total: total.value,
    company,
    stats,
    items,
    nonAwarded: {
      total: nonAwardedTotal.value,
      value: nonAwardedValue,
      stats: nonAwardedStats,
    },
  };

  // Ensure the result is fully serializable (strips any ES client internal properties)
  return JSON.parse(JSON.stringify(result_data));
}
