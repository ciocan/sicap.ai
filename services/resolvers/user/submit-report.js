import { getSession } from "@utils"

export async function submitReport(
  { contractId, confidence, comment, db },
  context,
) {
  const { prisma, req, apm } = context
  const session = await getSession(req)

  if (!session) {
    await prisma.$disconnect()
    return false
  }

  const tx = apm.startTransaction("submitReport")

  await prisma.$connect()

  const user = await prisma.user.findUnique({
    where: { hashId: session.user.hashId },
    select: {
      id: true,
    },
  })

  const report = await prisma.report
    .create({
      data: {
        User: { connect: { id: user.id } },
        contractId,
        confidence,
        db,
        comment: comment.slice(0, 1000),
      },
    })
    .catch((e) => {
      apm.captureError(e)
    })

  await prisma.$disconnect()
  tx.end()
  return report
}
