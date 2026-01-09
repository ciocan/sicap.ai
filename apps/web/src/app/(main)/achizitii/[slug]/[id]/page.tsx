import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { getCachedCompanyAchizitii } from "@/lib/cached-queries";
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

// Provide a sample for Cache Components build-time validation
// This placeholder will be validated at build time but won't generate actual pages
export function generateStaticParams() {
  return [{ slug: "firma", id: "666" }];
}

export async function generateMetadata(props: PageProps) {
  await connection();
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
      await getCachedCompanyAchizitii(companyProps);
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

async function PageContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; slug: SLUG }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id, slug } = await params;
  const resolvedSearchParams = await searchParams;

  return <CompanyAchizitii id={id} slug={slug} searchParams={resolvedSearchParams} />;
}

export default function Page({ params, searchParams }: PageProps) {
  return (
    <main className="container px-8 py-4 flex flex-col gap-2 lg:max-w-7xl">
      <Suspense fallback={<div className="text-sm">se incarca...</div>}>
        <PageContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
