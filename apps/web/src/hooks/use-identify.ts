import { useEffect } from "react";

import { authClient } from "@sicap/data/auth-client";

import { identifyUser } from "@/lib/telemetry";

export function useIdentify() {
  const { data: session, isPending } = authClient.useSession();

  const isAuthenticated = !!session?.user;
  const isLoading = isPending;
  const user = session?.user;
  const userId = user?.id;

  useEffect(() => {
    if (isAuthenticated && userId) {
      identifyUser(userId, user);
    }
  }, [isAuthenticated, userId, user]);

  return {
    authClient,
    isAuthenticated,
    isLoading,
    user,
    userId,
    status: isAuthenticated ? "authenticated" : "unauthenticated",
  };
}
