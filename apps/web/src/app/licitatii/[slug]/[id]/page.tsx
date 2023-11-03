import { Suspense } from "react";

import { getCompanyLicitatii } from "@sicap/api";
import { allowedSlugs, moneyRon } from "@/utils";
import { type SearchParams } from "@/components";
import { type SLUG } from "@/utils/types";
import { CompanyLicitatii } from "@/components/company-licitatii";

interface PageProps {
  params: {
    id: string;
    slug: SLUG;
  };
  searchParams: SearchParams;
}

export async function generateMetadata(props: PageProps) {
  const {
    params: { id, slug },
  } = props;

  if (!allowedSlugs.includes(slug)) {
    throw new Error("Adresa invalida");
  }

  const companyProps = slug === "firma" ? { supplierId: id } : { authorityId: id };
  const { total, stats, contractingAuthority, supplier } = await getCompanyLicitatii(companyProps);
  const totalValue = stats?.years.map((y) => y.value).reduce((a, b) => a + b, 0);
  const totalValueRon = moneyRon(totalValue);

  const title =
    slug === "firma"
      ? `${supplier.name}, ${supplier.address.city} `
      : `${contractingAuthority.contractingAuthorityNameAndFN}, ${contractingAuthority.city}`;

  return {
    title: `${title}  | Achizitii directe @ SICAP.ai`,
    description: `${total} achizitii in valoare de ${totalValueRon}`,
  };
}

export default async function Page(props: PageProps) {
  const {
    params: { id, slug },
    searchParams,
  } = props;

  return (
    <main className="container px-8 py-4 flex flex-col gap-2 lg:max-w-7xl">
      <Suspense fallback={<div className="text-sm">se incarca...</div>}>
        <CompanyLicitatii id={id} slug={slug} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
