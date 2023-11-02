import { Suspense } from "react";

import { getCompanyAchizitii } from "@sicap/api";
import { CompanyAchizitii } from "@/components/company-achizitii";
import { moneyRon } from "@/utils";
import { type SearchParams } from "@/components";

interface PageProps {
  params: {
    id: string;
  };
  searchParams: SearchParams;
}

export async function generateMetadata(props: PageProps) {
  const {
    params: { id },
  } = props;
  const { hits, stats, contractingAuthority } = await getCompanyAchizitii({ authority: id });
  const totalValue = stats?.years.map((y) => y.value).reduce((a, b) => a + b, 0);
  const totalValueRon = moneyRon(totalValue);
  return {
    title: `${contractingAuthority?.entityName}, ${contractingAuthority?.city}  | Achizitii directe @ SICAP.ai`,
    description: `${hits} achizitii in valoare de ${totalValueRon}`,
  };
}

export default async function Page(props: PageProps) {
  const {
    params: { id },
    searchParams,
  } = props;

  return (
    <main className="container px-8 py-4 flex flex-col gap-2 lg:max-w-7xl">
      <Suspense fallback={<div className="text-sm">se incarca...</div>}>
        <CompanyAchizitii id={id} type="authority" searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
