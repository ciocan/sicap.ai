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
  const searchParams = {
    index: [ES_INDEX_DIRECT, ES_INDEX_OFFLINE, ES_INDEX_PUBLIC],
    body: {
      query: {
        bool: {
          filter: [
            {
              bool: {
                should: [
                  // Achizitii directe - by supplier fiscal number
                  {
                    bool: {
                      filter: [
                        { match_phrase: { _index: ES_INDEX_DIRECT } },
                        { match_phrase: { "supplier.numericFiscalNumber": nationalId } },
                      ],
                    },
                  },
                  // Achizitii offline - by supplier fiscal number (in noticeEntityAddress)
                  {
                    bool: {
                      filter: [
                        { match_phrase: { _index: ES_INDEX_OFFLINE } },
                        { match_phrase: { "details.noticeEntityAddress.fiscalNumber": nationalId } },
                      ],
                    },
                  },
                  // Licitatii publice - by winner fiscal number
                  {
                    bool: {
                      filter: [
                        { match_phrase: { _index: ES_INDEX_PUBLIC } },
                        { match_phrase: { "noticeContracts.items.winner.fiscalNumberInt": nationalId } },
                      ],
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
              source: `
                if (doc.containsKey('item.noticeStateDate') && doc['item.noticeStateDate'].size() > 0) {
                  return doc['item.noticeStateDate'].value.getMillis();
                } else if (doc.containsKey('item.publicationDate') && doc['item.publicationDate'].size() > 0) {
                  return doc['item.publicationDate'].value.getMillis();
                } else {
                  return 0;
                }
              `,
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
              source: `
                if (doc.containsKey('item.noticeStateDate') && doc['item.noticeStateDate'].size() > 0) {
                  return doc['item.noticeStateDate'].value.getMillis();
                } else if (doc.containsKey('item.publicationDate') && doc['item.publicationDate'].size() > 0) {
                  return doc['item.publicationDate'].value.getMillis();
                } else {
                  return 0;
                }
              `,
              lang: "painless",
            },
            calendar_interval: "month",
          },
          aggs: {
            sales: {
              sum: {
                script: {
                  source: `
                    if (doc.containsKey('item.ronContractValue') && doc['item.ronContractValue'].size() > 0) {
                      return doc['item.ronContractValue'].value;
                    } else if (doc.containsKey('item.closingValue') && doc['item.closingValue'].size() > 0) {
                      return doc['item.closingValue'].value;
                    } else if (doc.containsKey('item.awardedValue') && doc['item.awardedValue'].size() > 0) {
                      return doc['item.awardedValue'].value;
                    } else {
                      return 0;
                    }
                  `,
                  lang: "painless",
                },
              },
            },
          },
        },
        years: {
          date_histogram: {
            script: {
              source: `
                if (doc.containsKey('item.noticeStateDate') && doc['item.noticeStateDate'].size() > 0) {
                  return doc['item.noticeStateDate'].value.getMillis();
                } else if (doc.containsKey('item.publicationDate') && doc['item.publicationDate'].size() > 0) {
                  return doc['item.publicationDate'].value.getMillis();
                } else {
                  return 0;
                }
              `,
              lang: "painless",
            },
            calendar_interval: "year",
          },
          aggs: {
            sales: {
              sum: {
                script: {
                  source: `
                    if (doc.containsKey('item.ronContractValue') && doc['item.ronContractValue'].size() > 0) {
                      return doc['item.ronContractValue'].value;
                    } else if (doc.containsKey('item.closingValue') && doc['item.closingValue'].size() > 0) {
                      return doc['item.closingValue'].value;
                    } else if (doc.containsKey('item.awardedValue') && doc['item.awardedValue'].size() > 0) {
                      return doc['item.awardedValue'].value;
                    } else {
                      return 0;
                    }
                  `,
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
    fields: [...fieldsAchizitii, ...filedsLicitatii, ...fieldsAchizitiiOffline],
    _source: true,
  };

  const result = await esClient.search(searchParams);
  const total = result.hits.total as SearchTotalHits;
  const hits = result.hits.hits;

  if (hits.length === 0) {
    throw new Error(`Nu s-au găsit rezultate pentru CUI: ${nationalId}`);
  }

  // Extract company/supplier info from the first result
  let company: CompanyInfo | null = null;

  for (const hit of hits) {
    const source = hit._source as Record<string, unknown>;

    if (hit._index === ES_INDEX_DIRECT) {
      const supplierData = source.supplier as Record<string, unknown> | undefined;
      if (supplierData) {
        company = {
          entityName: supplierData.entityName as string,
          fiscalNumber: supplierData.fiscalNumber as string,
          city: supplierData.city as string,
          county: supplierData.county as string,
          entityId: supplierData.entityId as number,
        };
        break;
      }
    } else if (hit._index === ES_INDEX_OFFLINE) {
      const details = source.details as Record<string, unknown> | undefined;
      const noticeEntityAddress = details?.noticeEntityAddress as Record<string, unknown> | undefined;
      if (noticeEntityAddress) {
        company = {
          entityName: noticeEntityAddress.organization as string,
          fiscalNumber: noticeEntityAddress.fiscalNumber as string,
          city: noticeEntityAddress.city as string,
          county: "",
          entityId: undefined,
        };
        break;
      }
    } else if (hit._index === ES_INDEX_PUBLIC) {
      const noticeContracts = source.noticeContracts as Record<string, unknown> | undefined;
      const items = noticeContracts?.items as Record<string, unknown>[] | undefined;
      // Find the winner that matches the nationalId we're searching for
      const matchingItem = items?.find((item) => {
        const w = item?.winner as Record<string, unknown> | undefined;
        return w?.fiscalNumberInt?.toString() === nationalId;
      });
      const winner = (matchingItem?.winner ?? items?.[0]?.winner) as Record<string, unknown> | undefined;
      if (winner) {
        const address = winner.address as Record<string, unknown> | undefined;
        company = {
          entityName: winner.name as string,
          fiscalNumber: (winner.fiscalNumber as string) || nationalId,
          city: (address?.city as string) || "",
          county:
            ((address?.nutsCodeItem as Record<string, unknown>)?.text as string) ||
            ((address?.county as Record<string, unknown>)?.text as string) ||
            "",
          entityId: winner.entityId as number,
        };
        break;
      }
    }
  }

  // Build stats from aggregations
  let stats = undefined;
  if (result.aggregations) {
    const years = result.aggregations.years as Buckets;
    const months = result.aggregations.months as Buckets;
    stats = {
      years: years.buckets.map(mapBucket),
      months: months.buckets.map(mapBucket),
    };
  }

  return {
    total: total.value,
    company,
    stats,
    items: hits.map((hit) => ({
      id: hit._id as string,
      index: hit._index as IndexName,
      fields: transformItem(hit._index, hit.fields as Fields, {} as Fields),
    })),
  };
}

