import elasticsearch from "elasticsearch"

import { ES_HOST } from "@utils/config"

const client = new elasticsearch.Client({
  host: ES_HOST,
})

export default async (req, res) => {
  const { query, db } = JSON.parse(req.body)
  let remoteAddress

  if (req.headers["x-forwarded-for"]) {
    remoteAddress = req.headers["x-forwarded-for"].split(",")[0]
  } else if (req.headers["x-real-ip"]) {
    remoteAddress = req.connection.remoteAddress
  } else {
    remoteAddress = req.connection.remoteAddress
  }

  if (!query) {
    res.end(JSON.stringify({ ok: false }))
    return
  }

  await client
    .index({
      index: "cautari",
      body: {
        db,
        query,
        "@timestamp": new Date(),
        remoteAddress,
      },
    })
    .catch((err) => {
      console.error(err)
      res.end(JSON.stringify({ ok: false, err }))
      return
    })

  res.end(JSON.stringify({ ok: true }))
}
