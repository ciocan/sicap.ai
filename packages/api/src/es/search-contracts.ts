import type { SearchTotalHits } from "@elastic/elasticsearch/lib/api/types";

import { esClient } from "./config";
import {
  ES_INDEX_DIRECT,
  ES_INDEX_PUBLIC,
  ES_INDEX_OFFLINE,
  RESULTS_PER_PAGE,
  type Fields,
  fieldsAchizitii,
  filedsLicitatii,
  transformItem,
  fieldsAchizitiiOffline,
} from "./utils";
import type { IndexName, SearchProps } from "./types";

const KEYWORD_SEARCH_FIELDS = {
  [ES_INDEX_PUBLIC]: [
    "item.noticeNo",
    "item.contractTitle.ro",
    "item.contractingAuthorityNameAndFN.ro",
    "item.cpvCodeAndName.ro",
    "noticeContracts.items.[0].contractTitle.ro",
    "noticeContracts.items.[0].lotsCaption.ro",
    "noticeContracts.items.[0].winnerCaption.ro",
    "publicNotice.caNoticeEdit_New.section2_New.section2_1_New.shortDescription.ro",
    "publicNotice.caNoticeEdit_New_U.section2_New_U.section2_1_New_U.shortDescription.ro",
    "publicNotice.caNoticeEdit_New_U.section2_New_U.section2_1_New_U.contractTitle.ro",
    "publicNotice.caNoticeEdit_New.section2_New.section2_2_New.descriptionList.contractTitle.ro",
    "publicNotice.caNoticeEdit_New.section5.cancelledLotList.noticeLot.title.ro",
  ],
  [ES_INDEX_DIRECT]: [
    "item.uniqueIdentificationCode",
    "item.contractingAuthority.ro",
    "item.cpvCode.ro",
    "item.directAcquisitionName.ro",
    "item.supplier.ro",
    "publicDirectAcquisition.directAcquisitionDescription.ro",
    "publicDirectAcquisition.directAcquisitionItems.catalogItemDescription.ro",
    "publicDirectAcquisition.directAcquisitionItems.catalogItemName.ro",
  ],
  [ES_INDEX_OFFLINE]: [
    "item.noticeNo",
    "item.contractObject.ro",
    "item.contractingAuthority.ro",
    "item.cpvCategory.ro",
    "item.cpvCode.ro",
    "item.supplier.ro",
  ],
} as const;

// Fields containing fiscal numbers (CUI/CIF) for each index
const CUI_SEARCH_FIELDS = {
  [ES_INDEX_PUBLIC]: [
    "noticeContracts.items.winner.fiscalNumberInt",
    "noticeContracts.items.winner.fiscalNumber",
    "noticeContracts.items.winners.fiscalNumberInt",
    "noticeContracts.items.winners.fiscalNumber",
    "item.nationalId",
  ],
  [ES_INDEX_DIRECT]: [
    "supplier.numericFiscalNumber",
    "supplier.fiscalNumber",
    "authority.numericFiscalNumber",
    "authority.fiscalNumber",
  ],
  [ES_INDEX_OFFLINE]: [
    "details.noticeEntityAddress.fiscalNumber",
    "authority.numericFiscalNumber",
    "authority.fiscalNumber",
  ],
} as const;

// Detects if query is a CUI and returns both numeric and RO-prefixed versions
function getCuiSearchTerms(query: string): { isCui: boolean; terms: string[] } {
  const normalized = query.trim().toUpperCase();

  // Check if query is "RO" + digits (6-10 chars)
  const roMatch = normalized.match(/^RO(\d{6,10})$/);
  if (roMatch) {
    return { isCui: true, terms: [roMatch[1], normalized] };
  }

  // Check if query is just digits (6-10 chars)
  const numericMatch = normalized.match(/^(\d{6,10})$/);
  if (numericMatch) {
    return { isCui: true, terms: [numericMatch[1], `RO${numericMatch[1]}`] };
  }

  return { isCui: false, terms: [] };
}

const getAllSearchFields = () => [
  ...KEYWORD_SEARCH_FIELDS[ES_INDEX_PUBLIC],
  ...KEYWORD_SEARCH_FIELDS[ES_INDEX_DIRECT],
  ...KEYWORD_SEARCH_FIELDS[ES_INDEX_OFFLINE],
];

const getAllCuiFields = () => [
  ...CUI_SEARCH_FIELDS[ES_INDEX_PUBLIC],
  ...CUI_SEARCH_FIELDS[ES_INDEX_DIRECT],
  ...CUI_SEARCH_FIELDS[ES_INDEX_OFFLINE],
];

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
    euFunds,
  } = filters;

  if (
    db?.filter((d) => [ES_INDEX_DIRECT, ES_INDEX_PUBLIC, ES_INDEX_OFFLINE].includes(d)).length === 0
  ) {
    throw new Error("Baza de date nu este specificata.");
  }

  const searchFields = getAllSearchFields();
  const cuiFields = getAllCuiFields();
  const cuiInfo = query ? getCuiSearchTerms(query) : { isCui: false, terms: [] };

  // Build CUI search clauses if query looks like a CUI
  // Use match_phrase which works across different field types (consistent with get-company-by-national-id)
  const cuiSearchClauses = cuiInfo.isCui
    ? cuiInfo.terms.flatMap((term) =>
        cuiFields.map((field) => ({ match_phrase: { [field]: term } })),
      )
    : [];

  const querySearch = {
    bool: {
      must: [
        query
          ? {
              bool: {
                should: [
                  {
                    multi_match: {
                      query: query,
                      fields: searchFields,
                      type: "best_fields",
                      operator: "and",
                      lenient: true,
                    },
                  },
                  {
                    multi_match: {
                      query: query,
                      fields: searchFields,
                      type: "phrase",
                      boost: 3,
                      lenient: true,
                    },
                  },
                  // Add CUI search clauses when query looks like a CUI
                  ...cuiSearchClauses,
                ],
                minimum_should_match: 1,
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
                    euFunds
                      ? {
                          bool: {
                            should: [
                              {
                                exists: {
                                  field:
                                    "publicNotice.caNoticeEdit_New.section2_New.section2_2_New.descriptionList.sysEuropeanFund.id",
                                },
                              },
                              {
                                exists: {
                                  field:
                                    "publicNotice.caNoticeEdit_New_U.section2_New_U.section2_2_New_U.descriptionList.sysEuropeanFund.id",
                                },
                              },
                            ],
                            minimum_should_match: 1,
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
                    euFunds
                      ? {
                          bool: {
                            should: [
                              {
                                exists: {
                                  field: "publicDirectAcquisition.sysEuropeanFund.id",
                                },
                              },
                            ],
                            minimum_should_match: 1,
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
                    euFunds
                      ? {
                          bool: {
                            should: [
                              {
                                exists: {
                                  field: "details.sysEuropeanFund.id",
                                },
                              },
                            ],
                            minimum_should_match: 1,
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
    items: result?.hits?.hits?.map((hit) => ({
      id: hit._id as string,
      index: hit._index as IndexName,
      fields: transformItem(hit._index, hit.fields as Fields, hit.highlight as Fields),
    })),
  };
}
