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
    fields: [
      ...fieldsAchizitii,
      ...filedsLicitatii,
      ...fieldsAchizitiiOffline,
      // Additional fields for authority info extraction (avoiding _source)
      "authority.entityName",
      "authority.fiscalNumber",
      "authority.entityId",
      "publicNotice.entityId",
    ],
    _source: false,
  };

  const result = await esClient.search(searchParams);
  const total = result.hits.total as SearchTotalHits;
  const hits = result.hits.hits;

  if (hits.length === 0) {
    throw new Error(`Nu s-au găsit rezultate pentru CUI: ${nationalId}`);
  }

  // Extract authority info from the first result using fields (not _source)
  let authority: AuthorityInfo | null = null;

  for (const hit of hits) {
    const fields = hit.fields as Fields | undefined;

    // Skip if no fields (defensive check)
    if (!fields) {
      continue;
    }

    if (hit._index === ES_INDEX_DIRECT || hit._index === ES_INDEX_OFFLINE) {
      // Achizitii directe/offline - authority info from fields
      const entityName = fields["authority.entityName"]?.[0] || fields["item.contractingAuthority"]?.[0];
      if (entityName) {
        authority = {
          entityName: entityName as string,
          fiscalNumber: (fields["authority.fiscalNumber"]?.[0] || fields["authority.numericFiscalNumber"]?.[0] || nationalId) as string,
          city: (fields["authority.city"]?.[0] || "") as string,
          county: (fields["authority.county"]?.[0] || "") as string,
          entityId: fields["authority.entityId"]?.[0] as number | undefined,
        };
        break;
      }
    } else if (hit._index === ES_INDEX_PUBLIC) {
      // Licitatii publice - authority info from fields
      const contractingAuthorityNameAndFN = fields["item.contractingAuthorityNameAndFN"]?.[0] as string | undefined;
      if (contractingAuthorityNameAndFN) {
        authority = {
          entityName: contractingAuthorityNameAndFN?.split(" - ")?.[1] || contractingAuthorityNameAndFN || "",
          fiscalNumber: nationalId,
          city: (fields["publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.city"]?.[0] ||
            fields["publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.city"]?.[0] || "") as string,
          county: (fields["publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.nutsCodeItem.text"]?.[0] ||
            fields["publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.county.text"]?.[0] ||
            fields["publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.nutsCodeItem.text"]?.[0] ||
            fields["publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.county.text"]?.[0] || "") as string,
          entityId: fields["publicNotice.entityId"]?.[0] as number | undefined,
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
      fields: transformItem(hit._index, (hit.fields || {}) as Fields, {} as Fields),
    })),
  };
}
