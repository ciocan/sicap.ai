import elasticsearch from "elasticsearch"

import { getSession } from "@utils"
import { ES_HOST } from "@utils/config"

const client = new elasticsearch.Client({
  host: ES_HOST,
})

export async function saveAlert({ cui }, context) {
  const { req, apm } = context
  const session = await getSession(req)

  if (!session) {
    return false
  }

  const tx = apm.startTransaction("saveAlert")

  try {
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

    tx.result = "success"
  } catch (err) {
    tx.result = "error"
    apm.captureError(err)
  }

  tx.end()

  return true
}
