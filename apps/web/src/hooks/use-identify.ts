import { useEffect } from "react";

import { useSession } from "@/lib/auth-client";
import { identifyUser } from "@/lib/telemetry";

export function useIdentify() {
  const { data, isPending } = useSession();
  const user = data?.user;
  const userId = user?.id;
  const isAuthenticated = !!user;
  const isLoading = isPending;
  const status = isPending ? "loading" : isAuthenticated ? "authenticated" : "unauthenticated";

  useEffect(() => {
    if (isAuthenticated && userId) {
      identifyUser(userId, user);
    }
  }, [isAuthenticated, userId, user]);

  return { isAuthenticated, isLoading, user, userId, status };
}
