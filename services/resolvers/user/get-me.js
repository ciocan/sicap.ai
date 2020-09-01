import { getSession } from "@utils"

export async function getMe(context) {
  const { prisma, req, apm } = context
  const session = await getSession(req)

  if (!session) {
    await prisma.disconnect()
    return null
  }

  const tx = apm.startTransaction("getMe")

  await prisma.connect()

  let user = null

  try {
    user = await prisma.user.findOne({
      where: { hashId: session.user.hashId },
      include: {
        bookmarks: {
          select: { contractId: true, db: true },
        },
        reports: true,
      },
    })

    tx.result = "success"
  } catch (err) {
    tx.result = "error"
    apm.captureError(err)
  }

  tx.end()
  await prisma.disconnect()
  return user
}
