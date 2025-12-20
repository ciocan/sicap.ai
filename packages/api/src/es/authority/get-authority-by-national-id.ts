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

interface AuthorityInfo {
  entityName: string;
  fiscalNumber: string;
  city: string;
  county: string;
  entityId?: number;
}

interface AuthorityByNationalIdArgs {
  nationalId: string;
  page?: number;
  perPage?: number;
}

export async function getAuthorityByNationalId({
  nationalId,
  page = 1,
  perPage = RESULTS_PER_PAGE,
}: AuthorityByNationalIdArgs) {
  if (!nationalId) {
    throw new Error("CUI/CIF este obligatoriu");
  }

  // Query all three indices for the given fiscal number
  const searchParams = {
    index: [ES_INDEX_DIRECT, ES_INDEX_OFFLINE, ES_INDEX_PUBLIC],
    body: {
      query: {
        bool: {
          filter: [
            {
              bool: {
                should: [
                  // Achizitii directe - by authority fiscal number
                  {
                    bool: {
                      filter: [
                        { match_phrase: { _index: ES_INDEX_DIRECT } },
                        { match_phrase: { "authority.numericFiscalNumber": nationalId } },
                      ],
                    },
                  },
                  // Achizitii offline - by authority fiscal number
                  {
                    bool: {
                      filter: [
                        { match_phrase: { _index: ES_INDEX_OFFLINE } },
                        { match_phrase: { "authority.numericFiscalNumber": nationalId } },
                      ],
                    },
                  },
                  // Licitatii publice - by nationalId (fiscal number)
                  {
                    bool: {
                      filter: [
                        { match_phrase: { _index: ES_INDEX_PUBLIC } },
                        { match_phrase: { "item.nationalId": nationalId } },
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

  // Extract authority info from the first result
  let authority: AuthorityInfo | null = null;

  for (const hit of hits) {
    const source = hit._source as Record<string, unknown>;

    if (hit._index === ES_INDEX_DIRECT || hit._index === ES_INDEX_OFFLINE) {
      const authorityData = source.authority as Record<string, unknown> | undefined;
      if (authorityData) {
        authority = {
          entityName: authorityData.entityName as string,
          fiscalNumber: authorityData.fiscalNumber as string,
          city: authorityData.city as string,
          county: authorityData.county as string,
          entityId: authorityData.entityId as number,
        };
        break;
      }
    } else if (hit._index === ES_INDEX_PUBLIC) {
      const item = source.item as Record<string, unknown> | undefined;
      const publicNotice = source.publicNotice as Record<string, unknown> | undefined;
      if (item) {
        const contractingAuthorityNameAndFN = item.contractingAuthorityNameAndFN as string;
        // Extract city/county from publicNotice
        const caNoticeEdit = publicNotice?.caNoticeEdit_New as Record<string, unknown> | undefined;
        const caNoticeEditU = publicNotice?.caNoticeEdit_New_U as Record<string, unknown> | undefined;
        const section1 = caNoticeEdit?.section1_New as Record<string, unknown> | undefined;
        const section1U = caNoticeEditU?.section1_New_U as Record<string, unknown> | undefined;
        const section1_1 = (section1?.section1_1 || section1U?.section1_1) as
          | Record<string, unknown>
          | undefined;
        const caAddress = section1_1?.caAddress as Record<string, unknown> | undefined;

        authority = {
          entityName:
            contractingAuthorityNameAndFN?.split(" - ")?.[1] || contractingAuthorityNameAndFN || "",
          fiscalNumber: nationalId,
          city: (caAddress?.city as string) || "",
          county:
            ((caAddress?.nutsCodeItem as Record<string, unknown>)?.text as string) ||
            ((caAddress?.county as Record<string, unknown>)?.text as string) ||
            "",
          entityId: publicNotice?.entityId as number,
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
    authority,
    stats,
    items: hits.map((hit) => ({
      id: hit._id as string,
      index: hit._index as IndexName,
      fields: transformItem(hit._index, hit.fields as Fields, {} as Fields),
    })),
  };
}

