import { getSession } from "@utils"

export async function toggleBookmark({ contractId, db }, context) {
  const { prisma, req } = context
  const session = await getSession(req)

  if (!session) {
    await prisma.$disconnect()
    return null
  }

  await prisma.$connect()

  const userSpec = {
    where: { hashId: session.user.hashId },
    include: {
      bookmarks: {
        select: { contractId: true, db: true },
      },
    },
  }

  const user = await prisma.user.findUnique(userSpec)

  const isBookmarked = !!user.bookmarks.find(
    (b) => b.contractId === contractId && b.db === db,
  )

  if (isBookmarked) {
    await prisma.bookmark.delete({
      where: {
        userId_contractId_db: { userId: user.id, contractId, db },
      },
    })
  } else {
    await prisma.bookmark.create({
      data: {
        User: { connect: { id: user.id } },
        contractId,
        db,
      },
    })
  }

  const u = await prisma.user.findUnique(userSpec)

  await prisma.$disconnect()
  return u.bookmarks
}
