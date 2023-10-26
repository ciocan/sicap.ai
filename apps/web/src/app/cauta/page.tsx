import { Suspense } from "react";

import { SearchList, type SearchParams } from "@/components";
import Loading from "./loading";

interface PageProps {
  searchParams: SearchParams;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const query = searchParams.q as string;

  return {
    title: `Cǎutare: "${query}"`,
    description: "Caută în baza de date a contractelor publice din România",
  };
}

export default async function Page(props: PageProps) {
  const { searchParams } = props;

  return (
    <main className="container px-8 py-4 flex flex-col gap-2 lg:max-w-7xl">
      <Suspense fallback={<Loading />}>
        <SearchList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
