import { getSession } from "@utils"

export async function getMe(context) {
  const { prisma, req } = context
  const session = await getSession(req)

  if (!session) {
    await prisma.$disconnect()
    return null
  }

  await prisma.$connect()

  let user = null

    user = await prisma.user.findUnique({
      where: { hashId: session.user.hashId },
      include: {
        bookmarks: {
          select: { contractId: true, db: true },
        },
        reports: true,
      },
    })

  await prisma.$disconnect()
  return user
}
