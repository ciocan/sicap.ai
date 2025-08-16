import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Logger } from "next-axiom";

import { db, userTable, accountTable, sessionTable, verificationTable } from "../db/schema";
import { addSubscriber, addSubscriberToLists, messageSubscriber } from "../lib/listmonk";
import { env } from "../lib/env";

const log = new Logger();

export const auth = betterAuth({
  debug: process.env.NODE_ENV === "development",
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: userTable,
      session: sessionTable,
      account: accountTable,
      verification: verificationTable,
    },
  }),
  account: {
    accountLinking: {
      trustedProviders: ["google"],
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_ID!,
      clientSecret: env.GOOGLE_SECRET,
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.given_name,
          lastName: profile.family_name,
        };
      },
    },
  },
  pages: {
    signIn: "/autentificare",
    signUp: "/",
    error: "/eroare",
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          log.info("User created", { userId: user.id });
          try {
            if (user.email && user.name) {
              await addSubscriber({
                email: user.email,
                name: user.name,
                attribs: { userId: user.id },
              });
              await addSubscriberToLists({ email: user.email, lists: ["users"] });
              await messageSubscriber({ email: user.email, template: "welcome" });
            }
          } catch (e) {
            console.error("Error in user creation hook:", e);
          }
        },
      },
      update: {
        after: async (user) => {
          log.info("User updated", { userId: user.id });
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          log.info("User signed in", { userId: session.userId });
        },
      },
    },
    telemetry: {
      debug: process.env.NODE_ENV !== "production",
      enabled: false,
    },
    plugins: [
      jwt({
        jwt: {
          definePayload: ({ user }) => {
            return {
              userId: user.id,
            };
          },
        },
      }),
      nextCookies(),
    ], // make sure nextCookies is the last plugin in the array
  },
  trustedOrigins: [env.NEXTAUTH_URL, env.AGENT_API_URL],
  advanced: {
    useSecureCookies: true,
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === "production",
      domain: ".sicap.ai",
    },
  },
  onAPIError: {
    onError: (error) => {
      console.error("API Error", error);
    },
    errorURL: `${env.NEXT_PUBLIC_BASE_URL}/eroare`,
    throw: true,
  },
});
