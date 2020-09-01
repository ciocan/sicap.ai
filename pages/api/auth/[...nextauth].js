import NextAuth from "next-auth"
import Providers from "next-auth/providers"

import PrismaAdapter from "@services/PrismaAdapter"
import { auth } from "@utils/config"

const options = {
  providers: [
    Providers.Google({
      clientId: auth.GOOGLE_ID,
      clientSecret: auth.GOOGLE_SECRET,
    }),
  ],
  secret: auth.SECRET,
  session: {
    jwt: true,
  },
  jwt: {
    secret: auth.SECRET,
  },
  debug: true,
  adapter: PrismaAdapter(),
  callbacks: {
    session: async (session) => {
      return Promise.resolve(session)
    },
  },
}

export default (req, res) => NextAuth(req, res, options)
