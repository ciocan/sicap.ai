import { getDurationInMilliseconds } from "@utils"
import { ES_HOST } from "@utils/config"

export default async (req, res) => {
  const start = process.hrtime()
  res.statusCode = 200
  res.setHeader("Content-Type", "application/json")
  const response = await fetch(ES_HOST)
  const result = await response.json()
  res.end(JSON.stringify({ ms: getDurationInMilliseconds(start), result }))
}
