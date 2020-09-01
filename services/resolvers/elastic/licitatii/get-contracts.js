import elasticsearch from "elasticsearch"
import { pick } from "ramda"

import { RESULTS_PER_PAGE } from "@utils/constants"
import { ES_HOST, ES_INDEX } from "@utils/config"
import { getDurationInMilliseconds } from "@utils"

const client = new elasticsearch.Client({
  host: ES_HOST,
})

import { noticeProps, noticeDetailsProps, caNoticeEdit_New } from "./_common"

export async function getContracts({ page = 1, query }) {
  const start = process.hrtime()
  const result = await client.search({
    index: ES_INDEX,
    body: {
      query: {
        multi_match: {
          query,
          type: "cross_fields",
          lenient: true,
        },
      },
      sort: [
        {
          "item.noticeStateDate": {
            order: "desc",
            unmapped_type: "boolean",
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
      from: (parseInt(page) - 1) * RESULTS_PER_PAGE,
    },
  })

  const data = {
    ms: getDurationInMilliseconds(start),
    hits: result.hits.total.value,
    list: result.hits.hits.map((res) => {
      res._source.item.contractTitle =
        (res.highlight["item.contractTitle"] &&
          res.highlight["item.contractTitle"][0]) ||
        res._source.item.contractTitle

      return {
        ...pick(noticeProps, res._source.item),
        ...{
          ...pick(noticeDetailsProps, res._source.publicNotice || {}),
          ...pick(
            caNoticeEdit_New,
            res._source?.publicNotice?.caNoticeEdit_New?.section2_New
              ?.section2_1_New || {}
          ),
          ...pick(["contractDate"], res._source.noticeContracts.items[0] || {}),
          ...pick(
            ["contractValue"],
            res._source.noticeContracts.items[0] || {}
          ),
          winner: {
            ...pick(
              ["name", "fiscalNumber", "fiscalNumberInt", "entityId"],
              res._source.noticeContracts?.items[0]?.winner || {}
            ),
          },
          winners: res._source.noticeContracts?.items[0]?.winners?.map(
            (winner) => ({
              ...pick(
                ["entityId", "name", "fiscalNumber", "fiscalNumberInt"],
                winner || {}
              ),
            })
          ),
        },
      }
    }),
  }

  return data
}
