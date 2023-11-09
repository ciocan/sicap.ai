"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import formbricks from "@formbricks/js";

import { env } from "@/lib/env.client";

const ENV_ID = env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;
const API_HOST = env.NEXT_PUBLIC_FORMBRICKS_API_HOST;

export default function FormbricksProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const session = useSession();

  useEffect(() => {
    formbricks.init({
      environmentId: ENV_ID,
      apiHost: API_HOST,
      debug: false,
    });
  }, []);

  useEffect(() => {
    if (session.status === "authenticated") {
      if (!formbricks.getPerson().attributes?.userId) {
        formbricks.setUserId(session.data.user.id);
        formbricks.setEmail(session.data.user.email!);
        formbricks.setAttribute("userId", session.data.user.id);
        formbricks.setAttribute("name", session.data.user.name);
        formbricks.setAttribute("email", session.data.user.email);
      }
    }
  }, [session]);

  useEffect(() => {
    formbricks?.registerRouteChange();
  }, [pathname, searchParams]);

  return null;
}
