import { Suspense } from "react";
import { connection } from "next/server";

import { ContractAchizitiiOffline } from "@/components/contract-achizitii-offline";
import { getCachedContractAchizitiiOffline } from "@/lib/cached-queries";
import { generateOpenGraph } from "@/utils/og";
import { notFound } from "next/navigation";

export type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

// Provide a sample for Cache Components build-time validation
export function generateStaticParams() {
  return [{ id: "100666666" }];
}

export async function generateMetadata(props: PageProps) {
  await connection();
  const { id } = await props.params;

  try {
    const contract = await getCachedContractAchizitiiOffline(id);
    const { noticeNo, contractObject } = contract;

    const title = `${noticeNo} | ${contractObject}`;
    const description = contractObject;

    return {
      title,
      description,
      ...generateOpenGraph({
        id,
        title,
        description: `${description?.substring(0, 60)}...`,
        path: `/achizitii-offline/contract/${id}`,
      }),
    };
  } catch {
    return notFound();
  }
}

async function PageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContractAchizitiiOffline id={id} />;
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
