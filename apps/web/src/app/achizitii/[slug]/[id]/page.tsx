import { Suspense } from "react";

import { getCompanyAchizitii } from "@sicap/api";
import { CompanyAchizitii } from "@/components/company-achizitii";
import { allowedSlugs, moneyRon } from "@/utils";
import { type SearchParams } from "@/components";
import { type SLUG } from "@/utils/types";
import { generateOpenGraph } from "@/utils/og";

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

  const propMappings = {
    autoritate: { authorityId: id },
    firma: { supplierId: id },
    cpv: { cpvCode: id },
  };
  const companyProps = propMappings[slug];

  const { total, stats, contractingAuthority, supplier } = await getCompanyAchizitii(companyProps);
  const totalValue = stats?.years.map((y) => y.value).reduce((a, b) => a + b, 0);
  const totalValueRon = moneyRon(totalValue);

  const titleMappings = {
    autoritate: `${contractingAuthority.entityName}, ${contractingAuthority.city}`,
    firma: `${supplier.entityName}, ${supplier.city}`,
    cpv: `${contractingAuthority.cpvCodeAndName}`,
  };

  const title = titleMappings[slug];
  const description = `${total} achizitii in valoare de ${totalValueRon}`;

  return {
    title,
    description,
    ...generateOpenGraph({
      id,
      title,
      description,
      path: `/achizitii/${slug}/${id}`,
    }),
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
        <CompanyAchizitii id={id} slug={slug} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
