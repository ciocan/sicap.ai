import { getSession } from "@utils"

export async function toggleBookmark({ contractId, db }, context) {
  const { prisma, req, apm } = context
  const session = await getSession(req)

  if (!session) {
    await prisma.disconnect()
    return null
  }

  const tx = apm.startTransaction("toggleBookmark")
  await prisma.connect()

  const userSpec = {
    where: { hashId: session.user.hashId },
    include: {
      bookmarks: {
        select: { contractId: true, db: true },
      },
    },
  }

  const user = await prisma.user.findOne(userSpec)
  const isBookmarked = !!user.bookmarks.find(
    (b) => b.contractId === contractId && b.db === db
  )

  if (isBookmarked) {
    await prisma.bookmark
      .delete({
        where: {
          userId: user.id,
          contractId,
          db,
        },
      })
      .then(() => (tx.result = "success"))
      .catch((e) => {
        apm.captureError(e)
      })
  } else {
    await prisma.bookmark
      .create({
        data: {
          User: { connect: { id: user.id } },
          contractId,
          db,
        },
      })
      .then(() => (tx.result = "success"))
      .catch((e) => {
        apm.captureError(e)
      })
  }

  const u = await prisma.user.findOne(userSpec)

  await prisma.disconnect()
  tx.end()
  return u.bookmarks
}
