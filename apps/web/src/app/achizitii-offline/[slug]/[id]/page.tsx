import { Suspense } from "react";
import { notFound } from "next/navigation";

import { getCompanyAchizitiiOffline } from "@sicap/api";
import { CompanyAchizitiiOffline } from "@/components/company-achizitii-offline";
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
    searchParams: { isFiscal },
  } = props;

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
      await getCompanyAchizitiiOffline(companyProps);
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

export default async function Page(props: PageProps) {
  const {
    params: { id, slug },
    searchParams,
  } = props;

  return (
    <main className="container px-8 py-4 flex flex-col gap-2 lg:max-w-7xl">
      <Suspense fallback={<div className="text-sm">se incarca...</div>}>
        <CompanyAchizitiiOffline id={id} slug={slug} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
