import { formatNumber, moneyEur, moneyRon } from "@/utils";
import { getCompanyAchizitii } from "@sicap/api";
import { ListItem } from "./list-item";
import { Pagination } from "./pagination";
import { type SearchParams } from "./search-list";
import { Chart } from "./chart";

interface CompanyAchizitiiProps {
  id: string;
  type: "supplier" | "authority";
  searchParams: SearchParams;
}

export async function CompanyAchizitii({ id, type, searchParams }: CompanyAchizitiiProps) {
  const { p: page = 1, perPage = 20 } = searchParams;
  const args = type === "supplier" ? { supplier: id } : { authority: id };
  const results = await getCompanyAchizitii({ ...args, page, perPage });
  const { total, contractingAuthority, stats } = results;
  const { fiscalNumber, entityName, city, county } = contractingAuthority;

  const totalValue = stats?.years.map((y) => y.value).reduce((a, b) => a + b, 0);
  const totalValueRon = moneyRon(totalValue);
  const totalValueEur = moneyEur(totalValue);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-semibold text-md">
          {fiscalNumber} / {entityName} / {city}, {county}
        </h1>
        <p className="text-sm">
          {formatNumber(total)} contracte in valoare de{" "}
          <span className="text-primary font-mono">{totalValueRon}</span> /{" "}
          <span className="font-mono">{totalValueEur}</span>
        </p>
      </div>
      <Chart stats={stats} />
      <div className="space-y-4">
        <h3 className="text-xs">
          Pagina {page} din {formatNumber(results.total)} rezultate
        </h3>
        <div className="flex flex-col gap-4">
          {results.items.map((item) => (
            <ListItem key={item.id} fields={item.fields} id={item.id} index={item.index} />
          ))}
        </div>
        <Pagination
          page={page}
          hasPreviousPage={page > 1}
          hasNextPage={page * perPage < results.total}
          pathname={`/achizitii/autoritate/${id}`}
        />
      </div>
    </div>
  );
}
