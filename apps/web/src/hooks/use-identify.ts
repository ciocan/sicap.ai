import { useEffect } from "react";
import { useSession } from "next-auth/react";

import { identifyUser } from "@/lib/telemetry";

export function useIdentify() {
  const session = useSession();
  const { status, data } = session;

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const user = data?.user;
  const { id: userId } = user ?? {};

  useEffect(() => {
    if (isAuthenticated && userId) {
      identifyUser(userId, user);
    }
  }, [isAuthenticated, userId, user]);

  return { isAuthenticated, isLoading, user, userId, status };
}
