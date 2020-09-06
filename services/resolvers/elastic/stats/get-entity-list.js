import elasticsearch from "elasticsearch"
import { fromUnixTime } from "date-fns"

import { ES_HOST, ES_INDEX, ES_INDEX_DIRECT } from "@utils/config"

const client = new elasticsearch.Client({
  host: ES_HOST,
})

const dbMap = {
  licitatii: {
    index: ES_INDEX,
    date: "item.noticeStateDate",
    field: {
      firme: "noticeContracts.items.winners.name.keyword",
      autoritati: "item.contractingAuthorityNameAndFN.keyword",
      "coduri-cpv": "item.cpvCodeAndName.keyword",
    },
    sum: "noticeContracts.items.contractValue",
    filter: {
      id: 5,
      field: "item.sysProcedureState.id",
    },
  },
  achizitii: {
    index: ES_INDEX_DIRECT,
    date: "item.publicationDate",
    field: {
      firme: "item.supplier.keyword",
      autoritati: "item.contractingAuthority.keyword",
      "coduri-cpv": "publicDirectAcquisition.cpvCode.text.keyword",
    },
    sum: "item.closingValue",
    filter: {
      id: 7,
      field: "item.sysDirectAcquisitionState.id",
    },
  },
}

export async function getEntityList({ db, stat, start, end }) {
  const range =
    start && end
      ? {
          range: {
            [dbMap[db].date]: {
              gte: fromUnixTime(start),
              lte: fromUnixTime(end),
              format: "strict_date_optional_time",
            },
          },
        }
      : null

  const result = await client.search({
    index: [dbMap[db].index],
    body: {
      aggs: {
        list: {
          terms: {
            field: dbMap[db].field[stat],
            order: {
              total: "desc",
            },
            size: 1000,
          },
          aggs: {
            total: {
              sum: {
                field: dbMap[db].sum,
              },
            },
          },
        },
      },
      size: 0,
      query: {
        bool: {
          filter: [
            {
              match_all: {},
            },
            {
              match_phrase: {
                [dbMap[db].filter.field]: dbMap[db].filter.id,
              },
            },
            range,
          ],
        },
      },
    },
  })

  return result.aggregations.list.buckets.map(({ key, doc_count, total }) => ({
    key,
    count: doc_count,
    value: total.value,
  }))
}
