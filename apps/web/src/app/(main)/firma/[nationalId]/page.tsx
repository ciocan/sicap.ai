import { Suspense } from "react";
import { notFound } from "next/navigation";

import { getCachedCompanyByNationalId } from "@/lib/cached-queries";
import { CompanyAll } from "@/components/company-all";
import { moneyRon } from "@/utils";
import type { SearchParams } from "@/components";
import { generateOpenGraph } from "@/utils/og";

export type PageProps = {
  params: Promise<{
    nationalId: string;
  }>;
  searchParams: Promise<SearchParams>;
};

// Provide a sample for Cache Components build-time validation
export function generateStaticParams() {
  return [{ nationalId: "666" }];
}

export async function generateMetadata(props: PageProps) {
  const { nationalId } = await props.params;

  try {
    const { total, stats, company } = await getCachedCompanyByNationalId({
      nationalId,
    });
    const totalValue = stats?.years.map((y) => y.value).reduce((a, b) => a + b, 0);
    const totalValueRon = moneyRon(totalValue);

    const title = company
      ? `${company.fiscalNumber} / ${company.entityName} / ${company.city}${company.county ? `, ${company.county}` : ""}`
      : `Firma: ${nationalId}`;

    const description = `${total} contracte in valoare de ${totalValueRon}`;

    return {
      title,
      description,
      ...generateOpenGraph({
        id: nationalId,
        title,
        description,
        path: `/firma/${nationalId}`,
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
  params: Promise<{ nationalId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { nationalId } = await params;
  const resolvedSearchParams = await searchParams;

  return <CompanyAll nationalId={nationalId} searchParams={resolvedSearchParams} />;
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

