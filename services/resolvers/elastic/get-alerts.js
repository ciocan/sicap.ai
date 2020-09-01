import elasticsearch from "elasticsearch"

import { getSession } from "@utils"
import { ES_HOST } from "@utils/config"

const client = new elasticsearch.Client({
  host: ES_HOST,
})

export async function getAlerts(context) {
  const { req, apm } = context
  const session = await getSession(req)

  if (!session) {
    return []
  }

  const tx = apm.startTransaction("getAlerts")

  try {
    const body = await client.get({
      index: "alerte",
      id: session.user.email,
    })

    tx.result = "success"
    tx.end()

    return body?._source?.cui || []
  } catch (e) {
    apm.captureError(e)
    tx.end()

    return []
  }
}
