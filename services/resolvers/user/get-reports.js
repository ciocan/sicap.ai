import { getSession } from "@utils"

export async function getReports(context) {
  const { prisma, req } = context
  const session = await getSession(req)

  if (!session) {
    await prisma.$disconnect()
    return []
  }

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

  await prisma.$disconnect()

  return user.reports || []
}
