import elasticsearch from "elasticsearch"
import { pick } from "ramda"

import { ES_HOST, ES_INDEX } from "@utils/config"
import { getDurationInMilliseconds } from "@utils"

const client = new elasticsearch.Client({
  host: ES_HOST,
})

import {
  noticeProps,
  noticeDetailsProps,
  caNoticeEdit_New,
  caNoticeEdit_New__section1_New__section1_1__caAddress,
  section2_2_New,
} from "./_common"

export async function getContract({ id }) {
  const start = process.hrtime()

  const result = await client.search({
    index: ES_INDEX,
    body: {
      query: {
        match: {
          _id: id,
        },
      },
    },
  })

  const [contract] = result.hits.hits
  const ms = getDurationInMilliseconds(start)

  if (!contract) {
    return null
  }

  const data = {
    ms,
    ...pick(noticeProps, contract._source.item),
    ...{
      ...pick(noticeDetailsProps, contract._source.publicNotice || {}),
      ...pick(
        caNoticeEdit_New,
        contract._source.publicNotice?.caNoticeEdit_New?.section2_New
          ?.section2_1_New || {},
      ),
      ...pick(
        caNoticeEdit_New__section1_New__section1_1__caAddress,
        contract._source.publicNotice?.caNoticeEdit_New?.section1_New
          ?.section1_1?.caAddress || {},
      ),
      ...pick(
        section2_2_New,
        contract._source.publicNotice?.caNoticeEdit_New?.section2_New
          ?.section2_2_New || {},
      ),
      ...pick(
        ["contractDate", "contractValue"],
        contract._source?.noticeContracts?.items[0] || {},
      ),
      winner: {
        ...pick(
          ["name", "fiscalNumber", "fiscalNumberInt", "entityId"],
          contract._source?.noticeContracts?.items[0]?.winner || {},
        ),
      },
      winners: contract._source?.noticeContracts?.items[0]?.winners?.map(
        (winner) => ({
          ...pick(
            ["entityId", "name", "fiscalNumber", "fiscalNumberInt"],
            winner || {},
          ),
        }),
      ),
      istoric: contract._source.istoric,
    },
  }

  return data
}
