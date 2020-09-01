import { getDurationInMilliseconds } from "@utils"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async (req, res) => {
  const start = process.hrtime()
  res.statusCode = 200
  res.setHeader("Content-Type", "application/json")

  let users = []
  let error = null

  users = await prisma.user.findMany({}).catch((e) => (error = e))

  await prisma.disconnect()
  res.end(
    JSON.stringify({ ms: getDurationInMilliseconds(start), users, error })
  )
}
