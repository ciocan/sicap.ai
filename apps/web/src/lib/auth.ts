import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { SqlFlavorOptions } from "@auth/drizzle-adapter/lib/utils";

import { db } from "../db/schema";
import { env } from "./env.server";

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  adapter: DrizzleAdapter(db as unknown as SqlFlavorOptions),
  providers: [
    Google({
      clientId: env.GOOGLE_ID,
      clientSecret: env.GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/autentificare",
    newUser: "/",
  },
  events: {
    async createUser({ user }) {
      console.log(`Created user: ${user.id} - ${user.name} - ${user.email}`);
    },
  },
});
