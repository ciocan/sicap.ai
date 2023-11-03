import { SearchTotalHits } from "@elastic/elasticsearch/lib/api/types";

import { esClient } from "../config";
import {
  ES_INDEX_PUBLIC,
  Fields,
  RESULTS_PER_PAGE,
  filedsLicitatii,
  transformItem,
} from "../utils";
import { RootObject } from "./types";
import { IndexName } from "../types";
import { decode } from "../../utils";

interface Bucket {
  key_as_string: string;
  doc_count: number;
  sales: {
    value: number;
  };
}

interface Buckets {
  buckets: Bucket[];
}

const mapBucket = (b: Bucket) => ({
  key: b.key_as_string,
  count: b.doc_count,
  value: b.sales.value,
});

interface Args {
  authorityId?: string;
  supplierId?: string;
  page?: number;
  perPage?: number;
}

export async function getCompanyLicitatii(args: Args) {
  const { supplierId, authorityId, page = 1, perPage = RESULTS_PER_PAGE } = args;

  if (!supplierId && !authorityId) {
    throw new Error('Trebuie sa specifici unul dintre parametri: "authorityId" sau "supplierId"');
  }

  const query = supplierId
    ? Number(supplierId)
      ? { match: { "noticeContracts.items.winners.entityId": Number(supplierId) } }
      : {
          match_phrase_prefix: {
            "noticeContracts.items.winners.name": decode(supplierId),
          },
        }
    : Number(authorityId)
    ? {
        match: { "publicNotice.entityId": Number(authorityId) },
      }
    : {
        match_phrase_prefix: {
          "item.contractingAuthorityNameAndFN": decode(authorityId as string),
        },
      };

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
      contractingAuthorityNameAndFN: firstContract._source.item.contractingAuthorityNameAndFN,
    },
    items: result?.hits.hits.map((hit) => ({
      id: hit._id,
      index: hit._index as IndexName,
      fields: transformItem(hit._index, hit.fields as Fields, hit.highlight as Fields),
    })),
    stats,
  };
}
