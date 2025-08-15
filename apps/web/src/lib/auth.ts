import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { Logger } from "next-axiom";

import { db, user, account, session, verification } from "../db/schema";
import { addSubscriber, addSubscriberToLists, messageSubscriber } from "./listmonk";
import { env } from "./env";

const log = new Logger();

export const auth = betterAuth({
  debug: process.env.NODE_ENV === "development",
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_ID!,
      clientSecret: env.GOOGLE_SECRET,
      // mapProfileToUser: (profile) => {
      //   return {
      //     firstName: profile.given_name,
      //     lastName: profile.family_name,
      //   };
      // },
    },
  },
  user: {
    additionalFields: {
      createdAt: {
        type: "string",
        required: false,
      },
      updatedAt: {
        type: "string",
        required: false,
      },
    },
  },
  // Custom pages
  pages: {
    signIn: "/autentificare",
    signUp: "/",
    error: "/eroare",
  },
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  // User lifecycle events for listmonk integration
  databaseHooks: {
    user: {
      create: {
        after: async (u) => {
          log.info("User created", { userId: u.id });

          try {
            await db
              .update(user)
              .set({
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
              .where(eq(user.id, u.id))
              .returning();

            if (u.email && u.name) {
              await addSubscriber({
                email: u.email,
                name: u.name,
                attribs: { userId: u.id },
              });
              await addSubscriberToLists({ email: u.email, lists: ["users"] });
              await messageSubscriber({ email: u.email, template: "welcome" });
            }
          } catch (e) {
            console.error("Error in user creation hook:", e);
          }
        },
      },
      update: {
        after: async (u) => {
          log.info("User updated", { userId: u.id });

          try {
            await db
              .update(user)
              .set({ updatedAt: new Date().toISOString() })
              .where(eq(user.id, u.id))
              .returning();
          } catch (e) {
            console.error("Error in user update hook:", e);
          }
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
      debug: false,
      enabled: false,
    },
    plugins: [nextCookies()], // make sure this is the last plugin in the array
  },
  trustedOrigins: [env.NEXTAUTH_URL],
});
