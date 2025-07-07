import { Suspense } from "react";

import { ContractAchizitii } from "@/components/contract-achizitii";
import { getContractAchizitii } from "@sicap/api";
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
    const contract = await getContractAchizitii(id);
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

export default async function Page(props: PageProps) {
  const {
    params: { id },
  } = props;

  return (
    <main className="container px-8 py-4 flex flex-col gap-2 lg:max-w-7xl">
      <Suspense fallback={<div className="text-sm">se incarca...</div>}>
        <ContractAchizitii id={id} />
      </Suspense>
    </main>
  );
}
