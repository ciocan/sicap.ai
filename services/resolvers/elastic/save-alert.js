import elasticsearch from "elasticsearch"

import { getSession } from "@utils"
import { ES_HOST } from "@utils/config"

const client = new elasticsearch.Client({
  host: ES_HOST,
})

export async function saveAlert({ cui }, context) {
  const { req } = context
  const session = await getSession(req)

  if (!session) {
    return false
  }

    await client.update({
      id: session.user.email,
      index: "alerte",
      body: {
        doc: {
          cui: cui
            .filter((c) => c)
            .map((c) => c.trim())
            .slice(0, 20),
        },
        doc_as_upsert: true,
      },
    })

  return true
}
