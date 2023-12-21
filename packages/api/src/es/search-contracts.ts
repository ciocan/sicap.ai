import { SearchTotalHits } from "@elastic/elasticsearch/lib/api/types";

import { esClient } from "./config";
import {
  ES_INDEX_DIRECT,
  ES_INDEX_PUBLIC,
  ES_INDEX_OFFLINE,
  RESULTS_PER_PAGE,
  Fields,
  fieldsAchizitii,
  filedsLicitatii,
  transformItem,
  fieldsAchizitiiOffline,
} from "./utils";
import { IndexName, SearchProps } from "./types";

export async function searchContracts({
  query,
  page = 1,
  perPage = RESULTS_PER_PAGE,
  filters,
}: SearchProps) {
  const {
    db,
    dateFrom,
    dateTo,
    valueFrom,
    valueTo,
    authority,
    cpv,
    localityAuthority,
    countyAuthority,
    supplier,
    localitySupplier,
    countySupplier,
  } = filters;

  if (
    db?.filter((d) => [ES_INDEX_DIRECT, ES_INDEX_PUBLIC, ES_INDEX_OFFLINE].includes(d)).length === 0
  ) {
    throw new Error("Baza de date nu este specificata.");
  }

  const querySearch = {
    bool: {
      must: [
        query
          ? {
              query_string: {
                query,
                type: "phrase",
                lenient: true,
              },
            }
          : undefined,
      ].filter(Boolean),
      filter: [
        {
          bool: {
            should: [
              // licitatii publice
              {
                bool: {
                  filter: [
                    {
                      range: {
                        "item.noticeStateDate": {
                          gte: dateFrom,
                          lte: dateTo,
                        },
                      },
                    },
                    valueFrom || valueTo
                      ? {
                          range: {
                            "noticeContracts.items.contractValue": {
                              gte: valueFrom ?? 0,
                              lte: valueTo ?? Number.MAX_SAFE_INTEGER,
                            },
                          },
                        }
                      : undefined,
                    authority
                      ? {
                          match_phrase: {
                            "item.contractingAuthorityNameAndFN": authority,
                          },
                        }
                      : undefined,
                    localityAuthority
                      ? {
                          bool: {
                            should: [
                              {
                                match_phrase: {
                                  "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.city":
                                    localityAuthority,
                                },
                              },
                              {
                                match_phrase: {
                                  "publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.city":
                                    localityAuthority,
                                },
                              },
                            ],
                            minimum_should_match: 1,
                          },
                        }
                      : undefined,
                    countyAuthority
                      ? {
                          bool: {
                            should: [
                              {
                                match_phrase: {
                                  "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.county.text":
                                    countyAuthority,
                                },
                              },
                              {
                                match_phrase: {
                                  "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.nutsCodeItem.text":
                                    countyAuthority,
                                },
                              },
                              {
                                match_phrase: {
                                  "publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.nutsCodeItem.text":
                                    countyAuthority,
                                },
                              },
                              {
                                match_phrase: {
                                  "publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.county.text":
                                    countyAuthority,
                                },
                              },
                            ],
                            minimum_should_match: 1,
                          },
                        }
                      : undefined,
                    supplier
                      ? {
                          match_phrase: {
                            "noticeContracts.items.winner.name": supplier,
                          },
                        }
                      : undefined,
                    localitySupplier
                      ? {
                          match_phrase: {
                            "noticeContracts.items.winner.address.city": localitySupplier,
                          },
                        }
                      : undefined,
                    countySupplier
                      ? {
                          bool: {
                            should: [
                              {
                                match_phrase: {
                                  "noticeContracts.items.winner.address.county.text":
                                    countySupplier,
                                },
                              },
                              {
                                match_phrase: {
                                  "noticeContracts.items.winner.address.nutsCodeItem.text":
                                    countySupplier,
                                },
                              },
                            ],
                            minimum_should_match: 1,
                          },
                        }
                      : undefined,
                    cpv
                      ? {
                          match_phrase: {
                            "item.cpvCodeAndName": cpv,
                          },
                        }
                      : undefined,
                  ].filter(Boolean),
                },
              },
              // achizitii directe
              {
                bool: {
                  filter: [
                    {
                      range: {
                        "item.publicationDate": {
                          gte: dateFrom,
                          lte: dateTo,
                        },
                      },
                    },
                    {
                      range: {
                        "item.closingValue": {
                          gte: valueFrom,
                          lte: valueTo,
                        },
                      },
                    },
                    authority
                      ? {
                          match_phrase: {
                            "item.contractingAuthority": authority,
                          },
                        }
                      : undefined,
                    localityAuthority
                      ? {
                          match_phrase: {
                            "authority.city": localityAuthority,
                          },
                        }
                      : undefined,
                    countyAuthority
                      ? {
                          match_phrase: {
                            "authority.county": countyAuthority,
                          },
                        }
                      : undefined,
                    supplier
                      ? {
                          match_phrase: {
                            "item.supplier": supplier,
                          },
                        }
                      : undefined,
                    localitySupplier
                      ? {
                          match_phrase: {
                            "supplier.city": localitySupplier,
                          },
                        }
                      : undefined,
                    countySupplier
                      ? {
                          match_phrase: {
                            "supplier.county": countySupplier,
                          },
                        }
                      : undefined,
                    cpv
                      ? {
                          match_phrase: {
                            "item.cpvCode": cpv,
                          },
                        }
                      : undefined,
                  ].filter(Boolean),
                },
              },
              // achizitii offline
              {
                bool: {
                  filter: [
                    {
                      range: {
                        "item.publicationDate": {
                          gte: dateFrom,
                          lte: dateTo,
                        },
                      },
                    },
                    {
                      range: {
                        "item.awardedValue": {
                          gte: valueFrom,
                          lte: valueTo,
                        },
                      },
                    },
                    authority
                      ? {
                          match_phrase: {
                            "item.contractingAuthority": authority,
                          },
                        }
                      : undefined,
                    localityAuthority
                      ? {
                          match_phrase: {
                            "authority.city": localityAuthority,
                          },
                        }
                      : undefined,
                    countyAuthority
                      ? {
                          match_phrase: {
                            "authority.county": countyAuthority,
                          },
                        }
                      : undefined,
                    supplier
                      ? {
                          match_phrase: {
                            "item.supplier": supplier,
                          },
                        }
                      : undefined,
                    localitySupplier
                      ? {
                          match_phrase: {
                            "details.noticeEntityAddress.city": localitySupplier,
                          },
                        }
                      : undefined,
                    countySupplier
                      ? {
                          match_phrase: {
                            "supplier.county": countySupplier,
                          },
                        }
                      : undefined,
                    cpv
                      ? {
                          match_phrase: {
                            "item.cpvCode": cpv,
                          },
                        }
                      : undefined,
                  ].filter(Boolean),
                },
              },
            ],
          },
        },
      ],
    },
  };

  const searchParams = {
    index: db,
    body: {
      query: querySearch,
      sort: [
        {
          _script: {
            type: "number",
            script: {
              source: `
                if (doc.containsKey('item.noticeStateDate')) {
                  return doc['item.noticeStateDate'].value.getMillis();
                } else if (doc.containsKey('item.publicationDate')) {
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
      highlight: {
        pre_tags: ["<mark>"],
        post_tags: ["</mark>"],
        fields: {
          "*": {},
        },
      },
      from: (page - 1) * perPage,
      size: perPage,
    },
    fields: [...fieldsAchizitii, ...filedsLicitatii, ...fieldsAchizitiiOffline],
    _source: false,
  };

  const result = await esClient.search(searchParams);
  const total = result.hits.total as SearchTotalHits;

  return {
    took: result.took,
    total: total.value,
    items: result?.hits.hits.map((hit) => ({
      id: hit._id,
      index: hit._index as IndexName,
      fields: transformItem(hit._index, hit.fields as Fields, hit.highlight as Fields),
    })),
  };
}
