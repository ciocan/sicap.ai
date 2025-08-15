import { useEffect } from "react";
import { identifyUser } from "@/lib/telemetry";
import { authClient } from "@/lib/auth-client";

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

  return { isAuthenticated, isLoading, user, userId, status: isAuthenticated ? "authenticated" : "unauthenticated" };
}
