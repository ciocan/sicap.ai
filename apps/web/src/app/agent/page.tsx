import { auth } from "@/lib/auth";
import { Agent } from "@/components/agent";
import { headers } from "next/headers";

export default async function Page() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });
  const userId = session?.user?.id ?? undefined;
  
  return <Agent userId={userId} />;
}
