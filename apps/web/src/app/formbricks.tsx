"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import formbricks from "@formbricks/js/website";

import { env } from "@/lib/env.client";

export default function FormbricksProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    formbricks.init({
      environmentId: env.NEXT_PUBLIC_FORMBRICKS_ENV_ID,
      apiHost: env.NEXT_PUBLIC_FORMBRICKS_API_HOST,
    });
  }, []);

  useEffect(() => {
    formbricks?.registerRouteChange();
  }, [pathname, searchParams]);

  return null;
}
