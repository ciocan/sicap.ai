import { PrismaClient } from "@prisma/client"
import { SHA3, enc } from "crypto-js"

const PrismaAdapter = () => {
  async function getAdapter(appOptions) {
    function _debug(...args) {
      if (appOptions.debug) {
        // eslint-disable-next-line
        console.log("[next-auth][adapter][debug]", ...args)
      }
    }

    async function getUserByProviderAccountId(providerId, providerAccountId) {
      _debug("getUserByProviderAccountId", providerId, providerAccountId)
      return null
    }

    async function getUserByEmail(email) {
      _debug("getUserByEmail", email)
      return null
    }

    async function createUser(profile) {
      _debug("createUser", profile)
      const prisma = new PrismaClient()
      const hashId = enc.Hex.stringify(SHA3(profile.email))

      const userFromDb = await prisma.user.findOne({ where: { hashId } })

      if (!userFromDb) {
        await prisma.user.create({ data: { hashId } })
      } else {
        await prisma.user.update({
          data: { updatedAt: new Date() },
          where: { hashId },
        })
      }

      await prisma.disconnect()
      return { hashId, ...profile }
    }

    async function linkAccount(
      userId,
      providerId,
      providerType,
      providerAccountId,
      refreshToken,
      accessToken,
      accessTokenExpires
    ) {
      _debug(
        "linkAccount",
        userId,
        providerId,
        providerType,
        providerAccountId,
        refreshToken,
        accessToken,
        accessTokenExpires
      )
      return null
    }

    return Promise.resolve({
      createUser,
      getUserByEmail,
      getUserByProviderAccountId,
      linkAccount,
    })
  }

  return {
    getAdapter,
  }
}

export default PrismaAdapter
