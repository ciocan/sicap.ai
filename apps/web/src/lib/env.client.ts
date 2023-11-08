import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_FORMBRICKS_API_HOST: z.string().min(1),
    NEXT_PUBLIC_FORMBRICKS_ENV_ID: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_API_HOST: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_API_KEY: z.string().min(1),
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().min(1),
    NEXT_PUBLIC_PLAUSIBLE_URL: z.string().min(1),
  },
  runtimeEnv: {
    NEXT_PUBLIC_FORMBRICKS_API_HOST: process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST,
    NEXT_PUBLIC_FORMBRICKS_ENV_ID: process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID,
    NEXT_PUBLIC_POSTHOG_API_HOST: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
    NEXT_PUBLIC_POSTHOG_API_KEY: process.env.NEXT_PUBLIC_POSTHOG_API_KEY,
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
    NEXT_PUBLIC_PLAUSIBLE_URL: process.env.NEXT_PUBLIC_PLAUSIBLE_URL,
  }
});
