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
import type { IndexName, SearchFilters, SearchProps, SearchStatusOption } from "./types";

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

// CUI fields for authority filter by index type
const AUTHORITY_CUI_FIELDS = {
  public: ["item.nationalId"],
  direct: ["authority.numericFiscalNumber", "authority.fiscalNumber"],
  offline: ["authority.numericFiscalNumber", "authority.fiscalNumber"],
} as const;

// CUI fields for supplier filter by index type
const SUPPLIER_CUI_FIELDS = {
  public: [
    "noticeContracts.items.winner.fiscalNumberInt",
    "noticeContracts.items.winner.fiscalNumber",
    "noticeContracts.items.winners.fiscalNumberInt",
    "noticeContracts.items.winners.fiscalNumber",
  ],
  direct: ["supplier.numericFiscalNumber", "supplier.fiscalNumber"],
  offline: ["details.noticeEntityAddress.fiscalNumber"],
} as const;

const STATUS_FIELDS = {
  [ES_INDEX_PUBLIC]: {
    id: "item.sysProcedureState.id",
    text: "item.sysProcedureState.text",
  },
  [ES_INDEX_DIRECT]: {
    id: "item.sysDirectAcquisitionState.id",
    text: "item.sysDirectAcquisitionState.text",
  },
  [ES_INDEX_OFFLINE]: {
    id: "item.sysNoticeState.id",
    text: "item.sysNoticeState.text",
  },
} as const;

type CuiTerms = { numeric: string; roPrefixed: string };

// Detects if query is a CUI and returns both numeric and RO-prefixed versions
function getCuiSearchTerms(query: string): { isCui: false } | ({ isCui: true } & CuiTerms) {
  const normalized = query.trim().toUpperCase();

  const roMatch = normalized.match(/^RO(\d{6,10})$/);
  if (roMatch) {
    return { isCui: true, numeric: roMatch[1], roPrefixed: normalized };
  }

  const numericMatch = normalized.match(/^(\d{6,10})$/);
  if (numericMatch) {
    return { isCui: true, numeric: numericMatch[1], roPrefixed: `RO${numericMatch[1]}` };
  }

  return { isCui: false };
}

// Long-mapped fields (e.g. fiscalNumberInt, numericFiscalNumber) reject non-digit input.
function isNumericCuiField(field: string): boolean {
  return field.endsWith("Int") || /(?:^|\.)numeric[A-Z]/.test(field);
}

function buildCuiClauses(terms: CuiTerms, fields: readonly string[]) {
  return fields.flatMap((field) =>
    isNumericCuiField(field)
      ? [{ match_phrase: { [field]: terms.numeric } }]
      : [
          { match_phrase: { [field]: terms.numeric } },
          { match_phrase: { [field]: terms.roPrefixed } },
        ],
  );
}

// Creates a filter clause that handles both CUI and name searches
function createCuiAwareFilter(
  value: string | undefined,
  nameField: string,
  cuiFields: readonly string[],
): object | undefined {
  if (!value) {
    return undefined;
  }

  const cuiInfo = getCuiSearchTerms(value);

  if (cuiInfo.isCui) {
    return {
      bool: {
        should: buildCuiClauses(cuiInfo, cuiFields),
        minimum_should_match: 1,
      },
    };
  }

  return {
    match_phrase: {
      [nameField]: value,
    },
  };
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

function createStatusFilter(index: IndexName, filters: SearchFilters) {
  const stateIds = filters.status
    ?.filter((selection) => selection.index === index)
    .map((selection) => selection.stateId);

  if (!stateIds?.length) {
    return undefined;
  }

  return {
    terms: {
      [STATUS_FIELDS[index].id]: stateIds,
    },
  };
}

function buildPublicFilters(filters: SearchFilters) {
  const {
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

  return [
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
    createCuiAwareFilter(
      authority,
      "item.contractingAuthorityNameAndFN",
      AUTHORITY_CUI_FIELDS.public,
    ),
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
    createCuiAwareFilter(
      supplier,
      "noticeContracts.items.winner.name",
      SUPPLIER_CUI_FIELDS.public,
    ),
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
                  "noticeContracts.items.winner.address.county.text": countySupplier,
                },
              },
              {
                match_phrase: {
                  "noticeContracts.items.winner.address.nutsCodeItem.text": countySupplier,
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
    createStatusFilter(ES_INDEX_PUBLIC, filters),
  ].filter(Boolean);
}

function buildDirectFilters(filters: SearchFilters) {
  const {
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

  return [
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
    createCuiAwareFilter(authority, "item.contractingAuthority", AUTHORITY_CUI_FIELDS.direct),
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
    createCuiAwareFilter(supplier, "item.supplier", SUPPLIER_CUI_FIELDS.direct),
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
    createStatusFilter(ES_INDEX_DIRECT, filters),
  ].filter(Boolean);
}

function buildOfflineFilters(filters: SearchFilters) {
  const {
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

  return [
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
    createCuiAwareFilter(authority, "item.contractingAuthority", AUTHORITY_CUI_FIELDS.offline),
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
    createCuiAwareFilter(supplier, "item.supplier", SUPPLIER_CUI_FIELDS.offline),
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
    createStatusFilter(ES_INDEX_OFFLINE, filters),
  ].filter(Boolean);
}

function buildSearchShouldClauses(filters: SearchFilters) {
  return [
    {
      bool: {
        filter: buildPublicFilters(filters),
      },
    },
    {
      bool: {
        filter: buildDirectFilters(filters),
      },
    },
    {
      bool: {
        filter: buildOfflineFilters(filters),
      },
    },
  ];
}

function buildKeywordMustClauses(query: string | undefined) {
  const searchFields = getAllSearchFields();
  const cuiFields = getAllCuiFields();
  const cuiInfo = query ? getCuiSearchTerms(query) : { isCui: false as const };
  const cuiSearchClauses = cuiInfo.isCui ? buildCuiClauses(cuiInfo, cuiFields) : [];

  return [
    query
      ? {
          bool: {
            should: [
              {
                multi_match: {
                  query,
                  fields: searchFields,
                  type: "best_fields",
                  operator: "and",
                  lenient: true,
                },
              },
              {
                multi_match: {
                  query,
                  fields: searchFields,
                  type: "phrase",
                  boost: 3,
                  lenient: true,
                },
              },
              ...cuiSearchClauses,
            ],
            minimum_should_match: 1,
          },
        }
      : undefined,
  ].filter(Boolean);
}

function buildSearchQuery(query: string | undefined, filters: SearchFilters) {
  return {
    bool: {
      must: buildKeywordMustClauses(query),
      filter: [
        {
          bool: {
            should: buildSearchShouldClauses(filters),
            minimum_should_match: 1,
          },
        },
      ],
    },
  };
}

export async function getSearchStatusOptions({
  query,
  filters,
}: {
  query?: string;
  filters: SearchFilters;
}) {
  const baseFilters = {
    ...filters,
    status: undefined,
  };

  const searchParams = {
    index: filters.db,
    body: {
      size: 0,
      query: buildSearchQuery(query, baseFilters),
      aggs: {
        public_statuses: {
          filter: {
            bool: {
              filter: [
                { term: { _index: ES_INDEX_PUBLIC } },
                ...buildPublicFilters(baseFilters),
              ],
            },
          },
          aggs: {
            statuses: {
              terms: {
                field: STATUS_FIELDS[ES_INDEX_PUBLIC].id,
                size: 25,
              },
              aggs: {
                label: {
                  top_hits: {
                    size: 1,
                    _source: false,
                    fields: [STATUS_FIELDS[ES_INDEX_PUBLIC].text],
                  },
                },
              },
            },
          },
        },
        direct_statuses: {
          filter: {
            bool: {
              filter: [
                { term: { _index: ES_INDEX_DIRECT } },
                ...buildDirectFilters(baseFilters),
              ],
            },
          },
          aggs: {
            statuses: {
              terms: {
                field: STATUS_FIELDS[ES_INDEX_DIRECT].id,
                size: 25,
              },
              aggs: {
                label: {
                  top_hits: {
                    size: 1,
                    _source: false,
                    fields: [STATUS_FIELDS[ES_INDEX_DIRECT].text],
                  },
                },
              },
            },
          },
        },
        offline_statuses: {
          filter: {
            bool: {
              filter: [
                { term: { _index: ES_INDEX_OFFLINE } },
                ...buildOfflineFilters(baseFilters),
              ],
            },
          },
          aggs: {
            statuses: {
              terms: {
                field: STATUS_FIELDS[ES_INDEX_OFFLINE].id,
                size: 25,
              },
              aggs: {
                label: {
                  top_hits: {
                    size: 1,
                    _source: false,
                    fields: [STATUS_FIELDS[ES_INDEX_OFFLINE].text],
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const result = await esClient.search(searchParams);
  const aggregations = (result.aggregations ?? {}) as Record<string, any>;

  return [ES_INDEX_PUBLIC, ES_INDEX_DIRECT, ES_INDEX_OFFLINE]
    .flatMap((index) => {
      const aggregation = aggregations[`${index}_statuses`];
      const buckets = aggregation?.statuses?.buckets ?? [];
      const textField = STATUS_FIELDS[index].text;

      return buckets
        .map((bucket: any) => {
          const label = bucket.label?.hits?.hits?.[0]?.fields?.[textField]?.[0];

          if (typeof label !== "string") {
            return undefined;
          }

          return {
            index,
            stateId: Number(bucket.key),
            label,
            token: `${index}:${bucket.key}`,
          } satisfies SearchStatusOption;
        })
        .filter(Boolean);
    })
    .sort((left, right) => {
      if (left.index === right.index) {
        return left.label.localeCompare(right.label, "ro");
      }

      return left.index.localeCompare(right.index, "en");
    });
}

export async function searchContracts({
  query,
  page = 1,
  perPage = RESULTS_PER_PAGE,
  filters,
}: SearchProps) {
  const { db } = filters;

  if (
    db?.filter((d) => [ES_INDEX_DIRECT, ES_INDEX_PUBLIC, ES_INDEX_OFFLINE].includes(d)).length === 0
  ) {
    throw new Error("Baza de date nu este specificata.");
  }

  const querySearch = buildSearchQuery(query, filters);

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
    items: result?.hits?.hits?.map((hit: (typeof result.hits.hits)[number]) => ({
      id: hit._id as string,
      index: hit._index as IndexName,
      fields: transformItem(hit._index, hit.fields as Fields, hit.highlight as Fields),
    })),
  };
}
