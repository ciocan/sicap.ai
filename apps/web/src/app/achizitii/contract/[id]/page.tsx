import { Suspense } from "react";

import { ContractAchizitii } from "@/components/contract-achizitii";
import { getContract } from "@sicap/api";

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata(props: PageProps) {
  const {
    params: { id },
  } = props;
  const contract = await getContract(id);
  const { uniqueIdentificationCode, directAcquisitionName, directAcquisitionDescription } =
    contract;

  return {
    title: `${uniqueIdentificationCode} | ${directAcquisitionName}`,
    description: directAcquisitionDescription,
  };
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
