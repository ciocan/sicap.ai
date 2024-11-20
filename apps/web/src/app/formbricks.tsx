"use client";
import { useEffect, useRef, createContext, useContext } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import type formbricksJs from "@formbricks/js";

import { env } from "@/lib/env";

type FormbricksInstance = typeof formbricksJs;
const FormbricksContext = createContext<FormbricksInstance | undefined>(undefined);

export function useFormbricks() {
  const context = useContext(FormbricksContext);
  return context;
}

export default function FormbricksProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const formbricksRef = useRef<FormbricksInstance>();
  const session = useSession();
  const userId = session.data?.user?.id;

  useEffect(() => {
    const initFormbricks = async () => {
      const formbricks = await import("@formbricks/js");
      await formbricks.default.init({
        environmentId: env.NEXT_PUBLIC_FORMBRICKS_ENV_ID,
        apiHost: env.NEXT_PUBLIC_FORMBRICKS_API_HOST,
        userId,
      });

      formbricksRef.current = formbricks.default;
    };
    initFormbricks();
  }, [userId]);

  useEffect(() => {
    formbricksRef.current?.registerRouteChange();
  }, [pathname, searchParams]);

  return (
    <FormbricksContext.Provider value={formbricksRef.current}>
      {children}
    </FormbricksContext.Provider>
  );
}
