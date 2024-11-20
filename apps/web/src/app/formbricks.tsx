"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import formbricks from "@formbricks/js";

import { env } from "@/lib/env";

// const initFormbricks = () => {
//   console.log("--------initFormbricks", typeof window !== "undefined");
//   if (typeof window !== "undefined") {
//     console.log("--------initFormbricks", env.NEXT_PUBLIC_FORMBRICKS_ENV_ID);
//     formbricksJs.init({
//       environmentId: env.NEXT_PUBLIC_FORMBRICKS_ENV_ID,
//       apiHost: env.NEXT_PUBLIC_FORMBRICKS_API_HOST,
//     });
//   }

//   return formbricksJs;
// };

// export const formbricks = initFormbricks();

export default function FormbricksProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log("--------initFormbricks", env.NEXT_PUBLIC_FORMBRICKS_ENV_ID);
    formbricks.init({
      environmentId: env.NEXT_PUBLIC_FORMBRICKS_ENV_ID,
      apiHost: env.NEXT_PUBLIC_FORMBRICKS_API_HOST,
    });
  }, []);

  useEffect(() => {
    // if (formbricks) {
    // formbricks.registerRouteChange();
    // }
  }, [pathname, searchParams]);

  return null;
}
