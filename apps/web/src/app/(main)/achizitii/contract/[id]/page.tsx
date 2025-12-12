import { Suspense } from "react";

import { ContractAchizitii } from "@/components/contract-achizitii";
import { getCachedContractAchizitii } from "@/lib/cached-queries";
import { generateOpenGraph } from "@/utils/og";
import { notFound } from "next/navigation";

export type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

// Provide a sample for Cache Components build-time validation
export function generateStaticParams() {
  return [{ id: "666666" }];
}

export async function generateMetadata(props: PageProps) {
  const { id } = await props.params;
  try {
    const contract = await getCachedContractAchizitii(id);
    const { uniqueIdentificationCode, directAcquisitionName, directAcquisitionDescription } =
      contract;

    const title = `${uniqueIdentificationCode} | ${directAcquisitionName}`;
    const description = directAcquisitionDescription;

    return {
      title,
      description,
      ...generateOpenGraph({
        id,
        title,
        description: `${description?.substring(0, 60)}...`,
        path: `/achizitii/contract/${id}`,
      }),
    };
  } catch {
    return notFound();
  }
}

async function PageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContractAchizitii id={id} />;
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
