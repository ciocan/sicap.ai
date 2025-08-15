import { headers } from "next/headers";

import { Agent } from "@/components/agent";
import { auth } from "@/lib/auth";

export default async function Page() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });
  const userId = session?.user?.id ?? undefined;

  return <Agent userId={userId} />;
}
