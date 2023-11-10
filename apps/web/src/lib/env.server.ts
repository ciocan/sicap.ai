import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    ES_URL: z.string().url(),
    DATABASE_URL: z.string().url(),
    DATABASE_AUTH_TOKEN: z.string().min(1),
    GOOGLE_ID: z.string().min(1),
    GOOGLE_SECRET: z.string().min(1),
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url(),
    OG_SECRET: z.string().min(1),
    BASE_URL: z.string().url(),
    LISTMONK_API_KEY: z.string().min(1),
    LISTMONK_API_URL: z.string().url(),
    LISTMONK_FROM_EMAIL: z.string().email(),
  },
  runtimeEnv: {
    ES_URL: process.env.ES_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,
    GOOGLE_ID: process.env.GOOGLE_ID,
    GOOGLE_SECRET: process.env.GOOGLE_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    OG_SECRET: process.env.OG_SECRET,
    BASE_URL: process.env.BASE_URL,
    LISTMONK_API_KEY: process.env.LISTMONK_API_KEY,
    LISTMONK_API_URL: process.env.LISTMONK_API_URL,
    LISTMONK_FROM_EMAIL: process.env.LISTMONK_FROM_EMAIL,
  },
});
