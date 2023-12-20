import { SearchTotalHits } from "@elastic/elasticsearch/lib/api/types";

import { esClient } from "../config";
import {
  ES_INDEX_OFFLINE,
  Fields,
  RESULTS_PER_PAGE,
  fieldsAchizitiiOffline,
  mapBucket,
  transformItem,
} from "../utils";
import { RootObject } from "./types";
import { Args, Buckets, IndexName } from "../types";

const getQueryForSupplierId = (id: string | undefined, isFiscal: string | undefined) => {
  if (!id) {
    return { match_all: {} };
  }
  if (isFiscal === "true") {
    return {
      match: { "details.noticeEntityAddress.fiscalNumber": id },
    };
  }
  return {
    match: { "supplier.entityId": Number(id) },
  };
};

const getQueryForAuthorityId = (id: string | undefined) => {
  if (!id) {
    return { match_all: {} };
  }
  return { match: { "authority.entityId": Number(id) } };
};

const getQueryForCpvCode = (cpvCode: string | undefined) => {
  return { match: { "details.cpvCode.localeKey.keyword": cpvCode } };
};

const getType = (supplierId?: string, authorityId?: string, cpvCode?: string) => {
  if (supplierId !== undefined) {
    return "supplierId";
  }
  if (authorityId !== undefined) {
    return "authorityId";
  }
  if (cpvCode !== undefined) {
    return "cpvCode";
  }
};

export async function getCompanyAchizitiiOffline(args: Args) {
  const { supplierId, isFiscal, authorityId, cpvCode, page = 1, perPage = RESULTS_PER_PAGE } = args;

  if (!supplierId && !authorityId && !cpvCode) {
    throw new Error(
      'Trebuie sa specifici unul dintre parametri: "authorityId", "supplierId" sau "cpvCode"',
    );
  }

  const queryTypeMappings = {
    supplierId: getQueryForSupplierId(supplierId, isFiscal),
    authorityId: getQueryForAuthorityId(authorityId),
    cpvCode: getQueryForCpvCode(cpvCode),
  };

  const type = getType(supplierId, authorityId, cpvCode) as keyof typeof queryTypeMappings;
  const query = queryTypeMappings[type];

  const result = await esClient.search({
    index: ES_INDEX_OFFLINE,
    body: {
      query,
      sort: [
        {
          "item.publicationDate": {
            order: "desc",
            unmapped_type: "boolean",
          },
        },
      ],
      aggs: {
        months: {
          date_histogram: {
            field: "item.publicationDate",
            calendar_interval: "month",
          },
          aggs: {
            sales: {
              sum: {
                field: "item.awardedValue",
              },
            },
          },
        },
        years: {
          date_histogram: {
            field: "item.publicationDate",
            calendar_interval: "year",
          },
          aggs: {
            sales: {
              sum: {
                field: "item.awardedValue",
              },
            },
          },
        },
      },
      from: (page - 1) * perPage,
      size: perPage,
    },
    fields: [...fieldsAchizitiiOffline],
  });

  const size = Buffer.byteLength(JSON.stringify(result));
  const allContracts = result.hits.hits as RootObject[];
  const [firstContract] = allContracts;
  const total = result.hits.total as SearchTotalHits;

  if (!firstContract) {
    throw new Error("Identificator invalid");
  }

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
    size,
    total: total.value,
    supplier: firstContract._source.supplier,
    details: firstContract._source.details,
    contractingAuthority: {
      ...firstContract._source.authority,
      cpvCodeAndName: firstContract._source.item.cpvCode,
      cpvCode: firstContract._source.details.cpvCode.localeKey,
    },
    items: result?.hits.hits.map((hit) => ({
      id: hit._id,
      index: hit._index as IndexName,
      fields: transformItem(hit._index, hit.fields as Fields, hit.highlight as Fields),
    })),
    stats,
  };
}
