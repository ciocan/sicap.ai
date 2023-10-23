"use client";
import formbricks from "@formbricks/js";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const ENV_ID = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID as string;
const API_HOST = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST as string;

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
