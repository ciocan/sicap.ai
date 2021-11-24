import { getSession } from "@utils"

export async function getBookmarks(context) {
  const { prisma, req, apm } = context
  const session = await getSession(req)

  if (!session) {
    await prisma.$disconnect()
    return []
  }

  const tx = apm.startTransaction("getBookmarks")

  await prisma.$connect()
  let user = null

  try {
    user = await prisma.user.findUnique({
      where: {
        hashId: session.user.hashId,
      },
      include: {
        bookmarks: {
          select: {
            contractId: true,
            db: true,
          },
        },
      },
    })

    tx.result = "success"
  } catch (err) {
    tx.result = "error"
    apm.captureError(err)
  }

  tx.end()
  return user?.bookmarks || []
}
