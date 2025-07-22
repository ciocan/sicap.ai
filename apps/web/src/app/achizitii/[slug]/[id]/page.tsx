import { Suspense } from "react";
import { notFound } from "next/navigation";

import { getCompanyAchizitii } from "@sicap/api";
import { CompanyAchizitii } from "@/components/company-achizitii";
import { allowedSlugs, moneyRon } from "@/utils";
import type { SearchParams } from "@/components";
import type { SLUG } from "@/utils/types";
import { generateOpenGraph } from "@/utils/og";

export type PageProps = {
  params: Promise<{
    id: string;
    slug: SLUG;
  }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata(props: PageProps) {
  const { id, slug } = await props.params;

  if (!allowedSlugs.includes(slug)) {
    throw new Error("Adresa invalida");
  }

  const propMappings = {
    autoritate: { authorityId: id },
    firma: { supplierId: id },
    cpv: { cpvCode: id },
  };
  const companyProps = propMappings[slug];

  try {
    const { total, stats, contractingAuthority, supplier } =
      await getCompanyAchizitii(companyProps);
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
  } catch {
    return notFound();
  }
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id, slug } = await params;

  return (
    <main className="container px-8 py-4 flex flex-col gap-2 lg:max-w-7xl">
      <Suspense fallback={<div className="text-sm">se incarca...</div>}>
        <CompanyAchizitii id={id} slug={slug} searchParams={await searchParams} />
      </Suspense>
    </main>
  );
}
