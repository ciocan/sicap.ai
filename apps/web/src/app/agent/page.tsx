import { headers } from "next/headers";

import { auth } from "@sicap/data/auth";
import { Agent } from "@/components/agent";

export default async function Page() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });
  const userId = session?.user?.id ?? undefined;

  return <Agent userId={userId} />;
}
