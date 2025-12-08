import { Suspense } from "react";
import { redirect } from "next/navigation";

import { SearchList, type SearchParams } from "@/components";
import { checkSearchTerms } from "@/utils";
import { auth } from "@/lib/auth";

export type PageProps = {
	searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ searchParams }: PageProps) {
	const { q: query } = await searchParams;

	return {
		title: `Cǎutare: "${query || "..."}"`,
		description: "Caută în baza de date a contractelor publice din România",
	};
}

export default async function Page({ searchParams }: PageProps) {
	const session = await auth();

	if (!session?.user && !checkSearchTerms(await searchParams)) {
		redirect("/autentificare");
	}

	return (
		<main className="container px-8 py-4 flex flex-col gap-2 lg:max-w-7xl">
			<Suspense fallback={<div className="text-sm">se incarca...</div>}>
				<SearchList searchParams={await searchParams} />
			</Suspense>
		</main>
	);
}
