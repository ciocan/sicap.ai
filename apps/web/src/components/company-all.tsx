import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";

import { getCachedCompanyByNationalId } from "@/lib/cached-queries";

import { formatNumber, moneyEur, moneyRon, slugify } from "@/utils";
import type { SearchParams } from "./search-list";
import { ListItem } from "./list-item";
import { Pagination } from "./pagination";
import { Chart } from "./chart";
import { PerPage } from "./per-page";
import { CSVDownload } from "./csv-download";
import { TopAuthorities } from "./top-authorities";

interface CompanyAllProps {
  nationalId: string;
  searchParams: SearchParams;
}

export async function CompanyAll({ nationalId, searchParams }: CompanyAllProps) {
  await connection();
  const { p: page = 1, perPage = 20 } = searchParams;

  let results: Awaited<ReturnType<typeof getCachedCompanyByNationalId>>;
  try {
    results = await getCachedCompanyByNationalId({
      nationalId,
      page,
      perPage,
    });
  } catch {
    return notFound();
  }

  const { total, company, stats } = results;

  const totalValue = stats?.years?.map((y) => y.value).reduce((a, b) => a + b, 0);
  const totalValueRon = moneyRon(totalValue);
  const totalValueEur = moneyEur(totalValue);

  const title = company
    ? `${company.fiscalNumber} / ${company.entityName}`
    : `Firma: ${nationalId}`;

  const localityLink =
    company?.city && company?.county
      ? `/localitate/${slugify(company.county)}/${slugify(company.city)}`
      : null;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-semibold text-lg">{title}</h1>
        {company?.city && (
          <p className="text-sm text-muted-foreground">
            {localityLink ? (
              <Link
                href={localityLink}
                className="hover:text-primary hover:underline"
                target="_blank"
              >
                {company.city}
                {company.county ? `, ${company.county}` : ""}
              </Link>
            ) : (
              <>
                {company.city}
                {company.county ? `, ${company.county}` : ""}
              </>
            )}
          </p>
        )}
        <p className="text-sm">
          {formatNumber(total)} contracte in valoare de{" "}
          <span className="text-primary font-mono">{totalValueRon}</span> /{" "}
          <span className="font-mono">{totalValueEur}</span>
        </p>
      </div>
      <Chart stats={stats} />
      <TopAuthorities nationalId={nationalId} />
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs">
            Pagina {page} din {formatNumber(results.total)} rezultate
          </h3>
          <div className="flex gap-2">
            <CSVDownload items={results.items} />
            <PerPage total={perPage} pathname={`/firma/${nationalId}`} />
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
          pathname={`/firma/${nationalId}`}
        />
      </div>
    </div>
  );
}
