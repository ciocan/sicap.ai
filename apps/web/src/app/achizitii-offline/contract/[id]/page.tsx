import { Suspense } from "react";

import { ContractAchizitiiOffline } from "@/components/contract-achizitii-offline";
import { getContractAchizitiiOffline } from "@sicap/api";
import { generateOpenGraph } from "@/utils/og";
import { notFound } from "next/navigation";

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
    const contract = await getContractAchizitiiOffline(id);
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

export default async function Page(props: PageProps) {
  const {
    params: { id },
  } = props;

  return (
    <main className="container px-8 py-4 flex flex-col gap-2 lg:max-w-7xl">
      <Suspense fallback={<div className="text-sm">se incarca...</div>}>
        <ContractAchizitiiOffline id={id} />
      </Suspense>
    </main>
  );
}
