import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { ContractLicitatii } from "@/components/contract-licitatii";
import { getCachedContractLicitatii } from "@/lib/cached-queries";
import { generateOpenGraph } from "@/utils/og";

export type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

// Provide a sample for Cache Components build-time validation
export function generateStaticParams() {
  return [{ id: "100420420" }];
}

export async function generateMetadata(props: PageProps) {
  await connection();
  const { id } = await props.params;
  try {
    const contract = await getCachedContractLicitatii(id);
    const { noticeNo, contractTitle, shortDescription } = contract;

    const title = `${noticeNo} | ${contractTitle}`;
    const description = shortDescription;

    return {
      title,
      description,
      ...generateOpenGraph({
        id,
        title,
        description: `${description?.substring(0, 60)}...`,
        path: `/licitatii/contract/${id}`,
      }),
    };
  } catch {
    return notFound();
  }
}

async function PageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContractLicitatii id={id} />;
}

export default function Page(props: PageProps) {
  return (
    <main className="container px-8 py-4 flex flex-col gap-2 lg:max-w-7xl">
      <Suspense fallback={<div className="text-sm">se incarca...</div>}>
        <PageContent params={props.params} />
      </Suspense>
    </main>
  );
}
