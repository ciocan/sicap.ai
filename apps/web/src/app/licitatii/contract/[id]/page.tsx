import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ContractLicitatii } from "@/components/contract-licitatii";
import { getContractLicitatii } from "@sicap/api";
import { generateOpenGraph } from "@/utils/og";

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata(props: PageProps) {
  const {
    params: { id },
  } = props;
  try {
    const contract = await getContractLicitatii(id);
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

export default async function Page(props: PageProps) {
  const {
    params: { id },
  } = props;

  return (
    <main className="container px-8 py-4 flex flex-col gap-2 lg:max-w-7xl">
      <Suspense fallback={<div className="text-sm">se incarca...</div>}>
        <ContractLicitatii id={id} />
      </Suspense>
    </main>
  );
}
