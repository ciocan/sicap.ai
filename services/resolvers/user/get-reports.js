import { getSession } from "@utils"

export async function getReports(context) {
  const { prisma, req, apm } = context
  const session = await getSession(req)

  if (!session) {
    await prisma.$disconnect()
    return []
  }

  const tx = apm.startTransaction("getReports")

  await prisma.$connect()

  const user = await prisma.user
    .findUnique({
      where: { hashId: session.user.hashId },
      include: {
        reports: {
          select: {
            contractId: true,
            createdAt: true,
            confidence: true,
            comment: true,
            db: true,
          },
        },
      },
    })
    .catch((e) => {
      tx.result = "error"
      apm.captureError(e)
    })

  await prisma.disconnect()
  tx.end()

  return user.reports || []
}
