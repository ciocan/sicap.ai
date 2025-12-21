import { notFound } from "next/navigation";

import { getCachedAuthorityByNationalId } from "@/lib/cached-queries";

import { formatNumber, moneyEur, moneyRon } from "@/utils";
import type { SearchParams } from "./search-list";
import { ListItem } from "./list-item";
import { Pagination } from "./pagination";
import { Chart } from "./chart";
import { PerPage } from "./per-page";
import { CSVDownload } from "./csv-download";

interface AuthorityAllProps {
  nationalId: string;
  searchParams: SearchParams;
}

export async function AuthorityAll({ nationalId, searchParams }: AuthorityAllProps) {
  const { p: page = 1, perPage = 20 } = searchParams;

  let results: Awaited<ReturnType<typeof getCachedAuthorityByNationalId>>;
  try {
    results = await getCachedAuthorityByNationalId({
      nationalId,
      page,
      perPage,
    });
  } catch {
    return notFound();
  }

  const { total, authority, stats } = results;

  const totalValue = stats?.years?.map((y) => y.value).reduce((a, b) => a + b, 0);
  const totalValueRon = moneyRon(totalValue);
  const totalValueEur = moneyEur(totalValue);

  const title = authority
    ? `${authority.fiscalNumber} / ${authority.entityName} / ${authority.city}${authority.county ? `, ${authority.county}` : ""}`
    : `Autoritate: ${nationalId}`;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-semibold text-lg">{title}</h1>
        <p className="text-sm">
          {formatNumber(total)} achizitii publice in valoare de{" "}
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
            <PerPage total={perPage} pathname={`/autoritate/${nationalId}`} />
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
          pathname={`/autoritate/${nationalId}`}
        />
      </div>
    </div>
  );
}
