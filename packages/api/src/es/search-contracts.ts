import { SearchTotalHits } from "@elastic/elasticsearch/lib/api/types";

import { esClient } from "./config";
import { ES_INDEX_DIRECT, ES_INDEX_PUBLIC, Fields, transformItem } from "./utils";
import { IndexName, SearchProps } from "./types";

export async function searchContracts({ query, page = 1, perPage = 20, filters }: SearchProps) {
  const {
    db,
    dateFrom,
    dateTo,
    valueFrom,
    valueTo,
    authority,
    cpv,
    localityAuthority,
    supplier,
    localitySupplier,
  } = filters;

  if (db?.filter((d) => [ES_INDEX_DIRECT, ES_INDEX_PUBLIC].includes(d)).length === 0) {
    throw new Error("Baza de date nu este specificata.");
  }

  const querySearch = {
    bool: {
      must: [
        query
          ? {
              multi_match: {
                query: query,
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
                    {
                      range: {
                        "noticeContracts.items.contractValue": {
                          gte: valueFrom,
                          lte: valueTo,
                        },
                      },
                    },
                    authority
                      ? {
                          match_phrase: {
                            "item.contractingAuthorityNameAndFN": authority,
                          },
                        }
                      : undefined,
                    localityAuthority
                      ? {
                          match_phrase: {
                            "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.city":
                              localityAuthority,
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
    fields: [
      // achizitii directe
      "item.directAcquisitionId",
      "item.directAcquisitionName",
      "item.sysDirectAcquisitionState.*",
      "item.uniqueIdentificationCode",
      "item.cpvCode",
      "item.publicationDate",
      "item.closingValue",
      "item.supplier",
      "item.contractingAuthority",
      "publicDirectAcquisition.cpvCode.*",
      "publicDirectAcquisition.supplierId",
      "publicDirectAcquisition.contractingAuthorityID",
      "publicDirectAcquisition.sysAcquisitionContractType.*",
      "authority.city",
      "supplier.city",
      // licitatii publice
      "item.caNoticeId",
      "item.noticeNo",
      "item.contractingAuthorityNameAndFN",
      "item.contractTitle",
      "item.sysAcquisitionContractType.*",
      "item.sysProcedureType.*",
      "item.sysContractAssigmentType.*",
      "item.sysNoticeState.*",
      "item.sysProcedureState.*",
      "item.cpvCodeAndName",
      "item.noticeStateDate",
      "publicNotice.entityId",
      "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.city",
      "noticeContracts.items.winner.name",
      "noticeContracts.items.winner.fiscalNumber",
      "noticeContracts.items.winner.fiscalNumberInt",
      "noticeContracts.items.winner.entityId",
      "noticeContracts.items.winner.address.city",
      "noticeContracts.items.contractValue",
    ],
    _source: false,
  };

  const result = await esClient.search(searchParams);

  // console.log(result.hits.hits[1]);
  console.log("TOOK", result.took);

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
