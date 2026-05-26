import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { mcp } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { Logger } from "next-axiom";

import {
  account,
  db,
  oauthAccessToken,
  oauthApplication,
  oauthConsent,
  session,
  user,
  verification,
} from "../db/schema";
import { addSubscriber, addSubscriberToLists, messageSubscriber } from "./listmonk";
import { env } from "./env";

const log = new Logger();

export const auth = betterAuth({
  baseURL: env.NEXTAUTH_URL,
  secret: env.AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user,
      session,
      account,
      verification,
      oauthApplication,
      oauthAccessToken,
      oauthConsent,
    },
  }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_ID ?? "",
      clientSecret: env.GOOGLE_SECRET ?? "",
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 300,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          const { id, email, name } = createdUser;
          log.info("User created", { userId: id });
          try {
            await addSubscriber({ email, name: name ?? email, attribs: { userId: id } });
            await addSubscriberToLists({ email, lists: ["users"] });
            await messageSubscriber({ email, template: "welcome" });
          } catch (_e) {
            log.error("Listmonk sync failed on user create", { userId: id });
          }
        },
      },
    },
    session: {
      create: {
        after: async (createdSession) => {
          const { userId } = createdSession;
          log.info("User signed in", { userId });
          await db.update(user).set({ updatedAt: new Date() }).where(eq(user.id, userId));
        },
      },
    },
  },
  plugins: [
    mcp({
      loginPage: "/autentificare",
      oidcConfig: {
        loginPage: "/autentificare",
        consentPage: "/oauth/consent",
      },
    }),
    nextCookies(),
  ],
});
