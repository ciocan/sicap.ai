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
      <div className="flex flex-col gap-4 max-w-xl place-center place-self-center mt-20">
        <h1>Pentru a beneficia de cautarea avansata trebuie sa fii utilizator autentificat.</h1>
        <SignIn />
      </div>
    </div>
  );
}
