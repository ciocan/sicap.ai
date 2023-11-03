import { SearchTotalHits } from "@elastic/elasticsearch/lib/api/types";

import { esClient } from "../config";
import {
  ES_INDEX_DIRECT,
  Fields,
  RESULTS_PER_PAGE,
  fieldsAchizitii,
  mapBucket,
  transformItem,
} from "../utils";
import { RootObject } from "./types";
import { Args, Buckets, IndexName } from "../types";

export async function getCompanyAchizitii(args: Args) {
  const { supplierId, authorityId, page = 1, perPage = RESULTS_PER_PAGE } = args;

  if (!supplierId && !authorityId) {
    throw new Error('Trebuie sa specifici unul dintre parametri: "authorityId" sau "supplierId"');
  }

  const query = supplierId
    ? {
        match: { "supplier.entityId": Number(supplierId) },
      }
    : {
        match: { "authority.entityId": Number(authorityId) },
      };

  const result = await esClient.search({
    index: ES_INDEX_DIRECT,
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
                field: "item.closingValue",
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
                field: "item.closingValue",
              },
            },
          },
        },
      },
      from: (page - 1) * perPage,
      size: perPage,
    },
    fields: [...fieldsAchizitii],
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
    supplier: firstContract._source.supplier,
    contractingAuthority: firstContract._source.authority,
    items: result?.hits.hits.map((hit) => ({
      id: hit._id,
      index: hit._index as IndexName,
      fields: transformItem(hit._index, hit.fields as Fields, hit.highlight as Fields),
    })),
    stats,
  };
}
