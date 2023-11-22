import { SearchTotalHits } from "@elastic/elasticsearch/lib/api/types";

import { esClient } from "../config";
import {
  ES_INDEX_PUBLIC,
  Fields,
  RESULTS_PER_PAGE,
  filedsLicitatii,
  mapBucket,
  transformItem,
} from "../utils";
import { RootObject } from "./types";
import { Args, Buckets, IndexName } from "../types";
import { decode } from "../../utils";

const getQueryForSupplierId = (id: string | undefined) => {
  if (!id) {
    return { match_all: {} };
  }
  return Number(id)
    ? { match: { "noticeContracts.items.winners.entityId": Number(id) } }
    : { match_phrase_prefix: { "noticeContracts.items.winners.name": decode(id) } };
};

const getQueryForAuthorityId = (id: string | undefined) => {
  if (!id) {
    return { match_all: {} };
  }
  return Number(id)
    ? { match: { "publicNotice.entityId": Number(id) } }
    : { match_phrase_prefix: { "item.contractingAuthorityNameAndFN": decode(id) } };
};

const getQueryForCpvCode = (cpvCode: string | undefined) => {
  return { match: { "item.cpvCode.keyword": cpvCode } };
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

export async function getCompanyLicitatii(args: Args) {
  const { supplierId, authorityId, cpvCode, page = 1, perPage = RESULTS_PER_PAGE } = args;

  if (!supplierId && !authorityId && !cpvCode) {
    throw new Error(
      'Trebuie sa specifici unul dintre parametri: "authorityId", "supplierId" sau "cpvCode"',
    );
  }

  const queryTypeMappings = {
    supplierId: getQueryForSupplierId(supplierId),
    authorityId: getQueryForAuthorityId(authorityId),
    cpvCode: getQueryForCpvCode(cpvCode),
  };

  const type = getType(supplierId, authorityId, cpvCode) as keyof typeof queryTypeMappings;
  const query = queryTypeMappings[type];

  const result = await esClient.search({
    index: ES_INDEX_PUBLIC,
    body: {
      query,
      sort: [
        {
          "item.noticeStateDate": {
            order: "desc",
            unmapped_type: "boolean",
          },
        },
      ],
      aggs: {
        months: {
          date_histogram: {
            field: "item.noticeStateDate",
            calendar_interval: "month",
          },
          aggs: {
            sales: {
              sum: {
                field: "item.ronContractValue",
              },
            },
          },
        },
        years: {
          date_histogram: {
            field: "item.noticeStateDate",
            calendar_interval: "year",
          },
          aggs: {
            sales: {
              sum: {
                field: "item.ronContractValue",
              },
            },
          },
        },
      },
      from: (page - 1) * perPage,
      size: perPage,
    },
    fields: [...filedsLicitatii],
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
    supplier: firstContract._source.noticeContracts?.items[0]?.winner,
    contractingAuthority: {
      ...firstContract._source.publicNotice?.caNoticeEdit_New?.section1_New?.section1_1?.caAddress,
      ...firstContract._source.publicNotice?.caNoticeEdit_New_U?.section1_New_U?.section1_1
        ?.caAddress,
      contractingAuthorityNameAndFN: firstContract._source.item.contractingAuthorityNameAndFN,
      cpvCodeAndName: firstContract._source.item.cpvCodeAndName,
    },
    items: result?.hits.hits.map((hit) => ({
      id: hit._id,
      index: hit._index as IndexName,
      fields: transformItem(hit._index, hit.fields as Fields, hit.highlight as Fields),
    })),
    stats,
  };
}
