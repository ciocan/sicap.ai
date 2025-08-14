import { auth } from "@/lib/auth";
import { Agent } from "@/components/agent";

export default async function Page() {
  const session = await auth();
  const userId = session?.user?.id ?? undefined;
  
  return <Agent userId={userId} />;
}
