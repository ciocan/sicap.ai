import elasticsearch from "elasticsearch"

import { ES_HOST, ES_INDEX, ES_INDEX_DIRECT } from "@utils/config"

const client = new elasticsearch.Client({
  host: ES_HOST,
})

export async function getTotal() {
  const licitatii = await client.search({
    index: ES_INDEX,
    body: {
      aggs: {
        contracte: {
          cardinality: {
            field: "item.caNoticeId",
          },
        },
      },
      size: 0,
    },
  })

  const achizitii = await client.search({
    index: ES_INDEX_DIRECT,
    body: {
      aggs: {
        contracte: {
          cardinality: {
            field: "item.directAcquisitionId",
          },
        },
      },
      size: 0,
    },
  })

  return {
    licitatii: licitatii.aggregations.contracte.value,
    achizitii: achizitii.aggregations.contracte.value,
  }
}
