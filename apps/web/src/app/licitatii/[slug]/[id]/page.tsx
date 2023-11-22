import { Suspense } from "react";
import { notFound } from "next/navigation";

import { getCompanyLicitatii } from "@sicap/api";
import { allowedSlugs, moneyRon } from "@/utils";
import { type SearchParams } from "@/components";
import { type SLUG } from "@/utils/types";
import { CompanyLicitatii } from "@/components/company-licitatii";
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

  try {
    const { total, stats, contractingAuthority, supplier } = await getCompanyLicitatii(
      companyProps,
    );
    const totalValue = stats?.years.map((y) => y.value).reduce((a, b) => a + b, 0);
    const totalValueRon = moneyRon(totalValue);

    const titleMappings = {
      autoritate: `${contractingAuthority.contractingAuthorityNameAndFN} / ${contractingAuthority.city}`,
      firma: `${supplier?.fiscalNumber} / ${supplier?.name} / ${supplier?.address?.city} ${
        supplier?.address?.county?.text ? `, ${supplier?.address?.county?.text}` : ""
      }`,
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
        path: `/licitatii/${slug}/${id}`,
      }),
    };
  } catch {
    return notFound();
  }
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
