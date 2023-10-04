import { getServerSideSitemapLegacy } from "next-sitemap"
import elasticsearch from "elasticsearch"

import { ES_HOST } from "@utils/config"

const client = new elasticsearch.Client({
  host: ES_HOST,
})

async function getContracts(size = 100) {
  const result = await client.search({
    index: "licitatii-publice",
    body: {
      query: {
        match_all: {},
      },
      sort: [
        {
          "item.noticeStateDate": {
            order: "desc",
            unmapped_type: "boolean",
          },
        },
      ],
      _source: ["_id", "item.noticeStateDate"],
      size,
    },
  })

  return result.hits.hits.map((res) => ({
    loc: `https://sicap.ai/licitatii/contract/${res._id}`,
    lastmod: res._source.item.noticeStateDate,
  }))
}

export const getServerSideProps = async (ctx) => {
  const fields = await getContracts(10000)
  return getServerSideSitemapLegacy(ctx, fields)
}

export default function Sitemap() {}
