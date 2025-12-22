import { notFound } from "next/navigation";

import { getCachedCompanyAchizitiiOffline } from "@/lib/cached-queries";

import { formatNumber, moneyEur, moneyRon } from "@/utils";
import type { SLUG } from "@/utils/types";
import type { SearchParams } from "./search-list";
import { ListItem } from "./list-item";
import { Pagination } from "./pagination";
import { Chart } from "./chart";
import { PerPage } from "./per-page";
import { CSVDownload } from "./csv-download";

interface CompanyAchizitiiOfflineProps {
  id: string;
  slug: SLUG;
  searchParams: SearchParams;
}

export async function CompanyAchizitiiOffline({
  id,
  slug,
  searchParams,
}: CompanyAchizitiiOfflineProps) {
  const { p: page = 1, perPage = 20, isFiscal } = searchParams;

  const propMappings = {
    autoritate: { authorityId: id },
    firma: { supplierId: id, isFiscal },
    cpv: { cpvCode: id },
  };
  const companyProps = propMappings[slug];

  let results: Awaited<ReturnType<typeof getCachedCompanyAchizitiiOffline>>;

  try {
    results = await getCachedCompanyAchizitiiOffline({
      ...companyProps,
      page,
      perPage,
    });
  } catch {
    return notFound();
  }

  const { total, contractingAuthority, supplier, stats, details } = results;
  const { fiscalNumber, entityName, city, county } = contractingAuthority;
  const { noticeEntityAddress } = details;

  const totalValue = stats?.years.map((y) => y.value).reduce((a, b) => a + b, 0);
  const totalValueRon = moneyRon(totalValue);
  const totalValueEur = moneyEur(totalValue);

  const firma =
    isFiscal === "true"
      ? `${noticeEntityAddress.fiscalNumber} / ${noticeEntityAddress.organization} / ${noticeEntityAddress.city}, ${noticeEntityAddress.country.text}`
      : `${supplier?.fiscalNumber} / ${supplier?.entityName} / ${supplier?.city}, ${supplier?.county}`;

  const titleMappings = {
    autoritate: `${fiscalNumber} / ${entityName} / ${city}, ${county}`,
    firma,
    cpv: `${results.contractingAuthority.cpvCodeAndName}`,
  };

  const title = titleMappings[slug];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-semibold text-lg">{title}</h1>
        <p className="text-sm">
          {formatNumber(total)} achizitii offline in valoare de{" "}
          <span className="text-primary font-mono">{totalValueRon}</span> /{" "}
          <span className="font-mono">{totalValueEur}</span>
        </p>
      </div>
      <Chart stats={stats} />
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs">
            Pagina {page} din {formatNumber(results.total)} rezultate
          </h3>
          <div className="flex gap-2">
            <CSVDownload items={results.items} />
            <PerPage total={perPage} pathname={`/achizitii-offline/${slug}/${id}`} />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {results.items.map((item) => (
            <ListItem key={item.id!} fields={item.fields} id={item.id!} index={item.index} />
          ))}
        </div>
        <Pagination
          page={page}
          hasPreviousPage={page > 1}
          hasNextPage={page * perPage < results.total}
          pathname={`/achizitii-offline/${slug}/${id}`}
        />
      </div>
    </div>
  );
}
