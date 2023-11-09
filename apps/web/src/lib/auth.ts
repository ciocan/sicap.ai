import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { Adapter } from "@auth/core/adapters";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { SqlFlavorOptions } from "@auth/drizzle-adapter/lib/utils";
import { DefaultSession } from "@auth/core/types";
import { eq, and } from "drizzle-orm";

import { accounts, db, users } from "../db/schema";
import { env } from "./env.server";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// TODO: Remove this when github issue is resolved
// https://github.com/nextauthjs/next-auth/issues/8377
function getAdapter(): Adapter {
  return {
    ...DrizzleAdapter(db as unknown as SqlFlavorOptions),
    async getUserByAccount(providerAccountId) {
      const results = await db
        .select()
        .from(accounts)
        .leftJoin(users, eq(users.id, accounts.userId))
        .where(
          and(
            eq(accounts.provider, providerAccountId.provider),
            eq(accounts.providerAccountId, providerAccountId.providerAccountId),
          ),
        )
        .get();

      return results?.user ?? null;
    },
  };
}

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  // debug: process.env.NODE_ENV === "development",
  adapter: getAdapter(),
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: env.GOOGLE_ID,
      clientSecret: env.GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/autentificare",
    newUser: "/",
    error: "/eroare",
  },
  events: {
    async createUser({ user }) {
      await db
        .update(users)
        .set({ createdAt: new Date().toISOString() })
        .where(eq(users.id, user.id))
        .returning();
    },
    async signIn({ user, isNewUser }) {
      await db
        .update(users)
        .set({ updatedAt: new Date().toISOString() })
        .where(eq(users.id, user.id))
        .returning();
    },
    async signOut(message) {},
  },
  callbacks: {
    redirect() {
      return "/";
    },
    async session({ token, session }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          name: token.name,
          email: token.email,
          image: token.picture,
        },
      };
    },
    async jwt({ token, user }) {
      const dbUser = await db
        .select()
        .from(users)
        .where(eq(users.email, token.email as string))
        .get();

      if (!dbUser) {
        token.id = user!.id;
        return token;
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
      };
    },
  },
});
