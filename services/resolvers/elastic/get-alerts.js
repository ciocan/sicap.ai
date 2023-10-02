import elasticsearch from "elasticsearch"

import { getSession } from "@utils"
import { ES_HOST } from "@utils/config"

const client = new elasticsearch.Client({
  host: ES_HOST,
})

export async function getAlerts(context) {
  const { req } = context
  const session = await getSession(req)

  if (!session) {
    return []
  }

  try {
    const body = await client.get({
      index: "alerte",
      id: session.user.email,
    })

    return body?._source?.cui || []
  } catch (e) {
    return []
  }
}
