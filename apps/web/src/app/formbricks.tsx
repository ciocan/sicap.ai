"use client";
import formbricks from "@formbricks/js";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { env } from "@/lib/env.client";

const ENV_ID = env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;
const API_HOST = env.NEXT_PUBLIC_FORMBRICKS_API_HOST;

export default function FormbricksProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    formbricks.init({
      environmentId: ENV_ID,
      apiHost: API_HOST,
      debug: false,
    });
  }, []);

  useEffect(() => {
    formbricks?.registerRouteChange();
  }, [pathname, searchParams]);

  return null;
}
