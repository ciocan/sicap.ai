import type { SearchTotalHits } from "@elastic/elasticsearch/lib/api/types";

import { esClient } from "../config";
import { ES_INDEX_DIRECT, ES_INDEX_OFFLINE, ES_INDEX_PUBLIC, mapBucket } from "../utils";
import type { Buckets } from "../types";

interface LocalityStatsArgs {
  city: string;
  county: string;
}

interface StatItem {
  key: string;
  count: number;
  value: number;
}

export interface LocalityStats {
  total: number;
  totalValue: number;
  uniqueAuthorities: number;
  uniqueCompanies: number;
  stats: {
    years: StatItem[];
    months: StatItem[];
  };
}

export async function getLocalityStats({
  city,
  county,
}: LocalityStatsArgs): Promise<LocalityStats> {
  if (!city || !county) {
    throw new Error("City and county are required");
  }

  // Normalize city name for matching (case-insensitive)
  const cityLower = city.toLowerCase();

  // Query all three indices for contracts involving authorities OR suppliers from this locality
  const searchParams = {
    index: [ES_INDEX_DIRECT, ES_INDEX_OFFLINE, ES_INDEX_PUBLIC],
    body: {
      size: 0,
      query: {
        bool: {
          should: [
            // DIRECT - authority or supplier in locality
            {
              bool: {
                filter: [
                  { match_phrase: { _index: ES_INDEX_DIRECT } },
                  {
                    bool: {
                      should: [
                        {
                          bool: {
                            must: [
                              { match_phrase: { "authority.city": cityLower } },
                            ],
                          },
                        },
                        {
                          bool: {
                            must: [
                              { match_phrase: { "supplier.city": cityLower } },
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
            // OFFLINE - authority or supplier in locality
            {
              bool: {
                filter: [
                  { match_phrase: { _index: ES_INDEX_OFFLINE } },
                  {
                    bool: {
                      should: [
                        {
                          bool: {
                            must: [
                              { match_phrase: { "authority.city": cityLower } },
                            ],
                          },
                        },
                        {
                          bool: {
                            must: [
                              { match_phrase: { "supplier.city": cityLower } },
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
            // PUBLIC - authority or winner in locality
            {
              bool: {
                filter: [
                  { match_phrase: { _index: ES_INDEX_PUBLIC } },
                  {
                    bool: {
                      should: [
                        {
                          bool: {
                            should: [
                              { match_phrase: { "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.city": cityLower } },
                              { match_phrase: { "publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.city": cityLower } },
                            ],
                            minimum_should_match: 1,
                          },
                        },
                        {
                          match_phrase: { "noticeContracts.items.winner.address.city": cityLower },
                        },
                      ],
                      minimum_should_match: 1,
                    },
                  },
                ],
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
      aggs: {
        total_value: {
          sum: {
            script: {
              source: `
                if (doc.containsKey('item.closingValue') && doc['item.closingValue'].size() > 0) {
                  return doc['item.closingValue'].value;
                } else if (doc.containsKey('item.ronContractValue') && doc['item.ronContractValue'].size() > 0) {
                  return doc['item.ronContractValue'].value;
                } else if (doc.containsKey('item.awardedValue') && doc['item.awardedValue'].size() > 0) {
                  return doc['item.awardedValue'].value;
                }
                return 0;
              `,
              lang: "painless",
            },
          },
        },
        unique_authorities: {
          cardinality: {
            script: {
              source: `
                if (doc.containsKey('authority.entityId') && doc['authority.entityId'].size() > 0) {
                  return doc['authority.entityId'].value;
                } else if (doc.containsKey('publicNotice.entityId') && doc['publicNotice.entityId'].size() > 0) {
                  return doc['publicNotice.entityId'].value;
                }
                return 0;
              `,
              lang: "painless",
            },
          },
        },
        unique_companies: {
          cardinality: {
            script: {
              source: `
                if (doc.containsKey('supplier.entityId') && doc['supplier.entityId'].size() > 0) {
                  return doc['supplier.entityId'].value;
                } else if (doc.containsKey('noticeContracts.items.winner.entityId') && doc['noticeContracts.items.winner.entityId'].size() > 0) {
                  return doc['noticeContracts.items.winner.entityId'].value;
                }
                return 0;
              `,
              lang: "painless",
            },
          },
        },
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
    },
  };

  const result = await esClient.search(searchParams);
  const total = (result.hits.total as SearchTotalHits).value;
  const aggregations = result.aggregations as {
    total_value: { value: number };
    unique_authorities: { value: number };
    unique_companies: { value: number };
    years: Buckets;
    months: Buckets;
  };

  return {
    total,
    totalValue: aggregations.total_value.value,
    uniqueAuthorities: aggregations.unique_authorities.value,
    uniqueCompanies: aggregations.unique_companies.value,
    stats: {
      years: aggregations.years.buckets.map(mapBucket),
      months: aggregations.months.buckets.map(mapBucket),
    },
  };
}

