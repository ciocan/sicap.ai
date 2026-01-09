import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { getCachedCompanyAchizitiiOffline } from "@/lib/cached-queries";
import { CompanyAchizitiiOffline } from "@/components/company-achizitii-offline";
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
export function generateStaticParams() {
  return [{ slug: "firma", id: "666" }];
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  await connection();
  const { id, slug } = await params;
  const { isFiscal } = await searchParams;

  if (!allowedSlugs.includes(slug)) {
    throw new Error("Adresa invalida");
  }

  const propMappings = {
    autoritate: { authorityId: id },
    firma: { supplierId: id, isFiscal },
    cpv: { cpvCode: id },
  };
  const companyProps = propMappings[slug];

  try {
    const { total, stats, contractingAuthority, supplier, details } =
      await getCachedCompanyAchizitiiOffline(companyProps);
    const { noticeEntityAddress } = details;

    const totalValue = stats?.years.map((y) => y.value).reduce((a, b) => a + b, 0);
    const totalValueRon = moneyRon(totalValue);

    const firma =
      isFiscal === "true"
        ? `${noticeEntityAddress.fiscalNumber} / ${noticeEntityAddress.organization} / ${noticeEntityAddress.city}, ${noticeEntityAddress.country.text}`
        : `${supplier?.fiscalNumber} / ${supplier?.entityName} / ${supplier?.city}, ${supplier?.county}`;

    const titleMappings = {
      autoritate: `${contractingAuthority.entityName}, ${contractingAuthority.city}`,
      firma,
      cpv: `${contractingAuthority.cpvCodeAndName}`,
    };

    const title = titleMappings[slug];
    const description = `${total} achizitii offline in valoare de ${totalValueRon}`;

    return {
      title,
      description,
      ...generateOpenGraph({
        id,
        title,
        description,
        path: `/achizitii-offline/${slug}/${id}`,
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

  return <CompanyAchizitiiOffline id={id} slug={slug} searchParams={resolvedSearchParams} />;
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
