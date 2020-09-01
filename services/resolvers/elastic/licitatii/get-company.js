import elasticsearch from "elasticsearch"

import { RESULTS_PER_PAGE } from "@utils/constants"
import { ES_HOST, ES_INDEX } from "@utils/config"
import { getDurationInMilliseconds, decode } from "@utils"
import { _source } from "./_common"

const client = new elasticsearch.Client({
  host: ES_HOST,
})

const mapBucket = (b) => ({
  key: b.key_as_string,
  count: b.doc_count,
  value: b.sales.value,
})

export async function getCompany(args) {
  const { authority, company, page = 1 } = args
  const start = process.hrtime()

  if (!authority && !company) return null

  const query = company
    ? Number(company)
      ? { match: { "noticeContracts.items.winners.entityId": Number(company) } }
      : {
          match_phrase_prefix: {
            "noticeContracts.items.winners.name": decode(company),
          },
        }
    : Number(authority)
    ? {
        match: { "publicNotice.entityId": Number(authority) },
      }
    : {
        match_phrase_prefix: {
          "item.contractingAuthorityNameAndFN": decode(authority),
        },
      }

  const result = await client.search({
    index: ES_INDEX,
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
                field: "noticeContracts.items.contractValue",
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
                field: "noticeContracts.items.contractValue",
              },
            },
          },
        },
      },
      _source,
      from: (parseInt(page) - 1) * RESULTS_PER_PAGE,
    },
  })

  const ms = getDurationInMilliseconds(start)
  const size = Buffer.byteLength(JSON.stringify(result))
  const [firstContract] = result.hits.hits

  if (!firstContract)
    return {
      ms,
      size,
      hits: result.hits.total.value,
    }

  return {
    ms,
    size,
    hits: result.hits.total.value,
    caAddress: {
      ...firstContract._source.publicNotice?.caNoticeEdit_New?.section1_New
        ?.section1_1?.caAddress,
      contractingAuthorityNameAndFN:
        firstContract._source.item.contractingAuthorityNameAndFN,
    },
    winner: firstContract._source.noticeContracts?.items[0]?.winner,
    list: result.hits.hits.map((res) => {
      return {
        ...res._source.item,
        ...res._source.publicNotice,
        ...res._source.publicNotice?.caNoticeEdit_New?.section1_New?.section1_1,
        ...res._source.publicNotice?.caNoticeEdit_New?.section2_New
          .section2_1_New,
        ...res._source.publicNotice?.caNoticeEdit_New?.section2_New
          ?.section2_2_New,
        ...res._source.noticeContracts?.items[0],
      }
    }),
    stats: {
      years: result.aggregations.years.buckets.map(mapBucket),
      months: result.aggregations.months.buckets.map(mapBucket),
    },
  }
}
