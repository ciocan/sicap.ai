import elasticsearch from "elasticsearch"

import { ES_HOST } from "@utils/config"

const client = new elasticsearch.Client({
    host: ES_HOST,
  })

export default async (req, res) => {
    const { query, db } = JSON.parse(req.body)

    if (!query) {
        res.end(JSON.stringify({ ok: false }))
        return
    }
    
    await client.index({
        index: "cautari",
        body: {
          db,
          query,
          "@timestamp": new Date(),
        },
      })
      .catch((err) => {
        console.error(err)
        res.end(JSON.stringify({ ok: false, err }))
        return
      }) 

  res.end(JSON.stringify({ ok: true }))
}
