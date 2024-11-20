import { useEffect } from "react";
import { useSession } from "next-auth/react";

import { identifyUser } from "@/lib/telemetry";
import { useFormbricks } from "@/app/formbricks";

export function useIdentify() {
  const session = useSession();
  const isAuthenticated = session.status === "authenticated";
  const userId = session.data?.user?.id;
  const email = session.data?.user?.email;
  const userName = session.data?.user?.name;
  const userImage = session.data?.user?.image;
  const formbricks = useFormbricks();

  useEffect(() => {
    if (isAuthenticated && userId && email) {
      identifyUser(userId, { email });
      formbricks?.setEmail(email);
      formbricks?.setAttribute("name", userName);
    }
  }, [isAuthenticated, userId, email, userName, formbricks]);

  return { isAuthenticated, email, userId, userName, userImage };
}
