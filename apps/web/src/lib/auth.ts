import NextAuth from "next-auth";
import "next-auth/jwt";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { Logger } from "next-axiom";

import { accounts, db, sessions, users, verificationTokens } from "../db/schema";
import { addSubscriber, addSubscriberToLists, messageSubscriber } from "./listmonk";
import { env } from "./env";

const log = new Logger();

export const { handlers, auth } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
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
      const email = user.email!;
      const name = user.name!;
      const userId = user.id!;
      log.info("User created", { userId });

      try {
        await db
          .update(users)
          .set({ createdAt: new Date().toISOString() })
          .where(eq(users.id, userId))
          .returning();

        await addSubscriber({
          email,
          name,
          attribs: { userId },
        });
        await addSubscriberToLists({ email, lists: ["users"] });
        await messageSubscriber({ email, template: "welcome" });
      } catch (_e) {}
    },

    async signIn({ user, isNewUser: _isNewUser }) {
      log.info("User signed in", { userId: user.id });
      await db
        .update(users)
        .set({ updatedAt: new Date().toISOString() })
        .where(eq(users.id, user.id!))
        .returning();
    },
    async signOut(message: { token: { id: string } }) {
      const userId = message.token.id;
      log.info("User signed out", { userId });
    },
  },
  callbacks: {
    redirect() {
      return "/";
    },
    async session({ session, token }) {
      if (token?.accessToken) {
        session.accessToken = token.accessToken;
      }
      if (token?.id) {
        session.user.id = token.id;
      }
      return session;
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

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    id?: string;
  }
}
