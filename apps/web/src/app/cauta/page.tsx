import { Suspense } from "react";

import { SearchList, type SearchParams } from "@/components";
import { checkSearchTerms } from "@/utils";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

interface PageProps {
  searchParams: SearchParams;
}

export const revalidate = 24 * 3600;

export async function generateMetadata({ searchParams }: PageProps) {
  const query = searchParams.q as string;

  return {
    title: `Cǎutare: "${query || "..."}"`,
    description: "Caută în baza de date a contractelor publice din România",
  };
}

export default async function Page(props: PageProps) {
  const session = await auth();
  const { searchParams } = props;

  if (!session?.user && !checkSearchTerms(searchParams)) {
    redirect("/autentificare");
  }

  return (
    <main className="container px-8 py-4 flex flex-col gap-2 lg:max-w-7xl">
      <Suspense fallback={<div className="text-sm">se incarca...</div>}>
        <SearchList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
