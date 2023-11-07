import { SignIn } from "@/components/auth";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="container px-8 py-4 flex flex-col gap-2 lg:max-w-7xl">
      <SignIn />
    </div>
  );
}
