import { formatNumber, moneyEur, moneyRon } from "@/utils";
import { getCompanyLicitatii } from "@sicap/api";
import { ListItem } from "./list-item";
import { Pagination } from "./pagination";
import { type SearchParams } from "./search-list";
import { Chart } from "./chart";
import { type SLUG } from "@/utils/types";
import { PerPage } from "./per-page";

interface CompanyAchizitiiProps {
  id: string;
  slug: SLUG;
  searchParams: SearchParams;
}

export async function CompanyLicitatii({ id, slug, searchParams }: CompanyAchizitiiProps) {
  const { p: page = 1, perPage = 20 } = searchParams;
  const propMappings = {
    autoritate: { authorityId: id },
    firma: { supplierId: id },
    cpv: { cpvCode: id },
  };
  const companyProps = propMappings[slug];
  const results = await getCompanyLicitatii({ ...companyProps, page, perPage });
  const { total, contractingAuthority, supplier, stats } = results;
  const { nationalIDNumber, officialName, city, county } = contractingAuthority;

  const totalValue = stats?.years.map((y) => y.value).reduce((a, b) => a + b, 0);
  const totalValueRon = moneyRon(totalValue);
  const totalValueEur = moneyEur(totalValue);

  const titleMappings = {
    autoritate: `${nationalIDNumber} / ${officialName} / ${city} ${
      county?.text ? `, ${county?.text}` : ""
    }`,
    firma: `${supplier.fiscalNumber} / ${supplier.name} / ${supplier.address.city} ${
      supplier.address.county?.text ? `, ${supplier.address.county?.text}` : ""
    }`,
    cpv: `${results.contractingAuthority.cpvCodeAndName}`,
  };

  const title = titleMappings[slug];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-semibold text-lg">{title}</h1>
        <p className="text-sm">
          {formatNumber(total)} contracte in valoare de{" "}
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
          <PerPage total={perPage} pathname={`/licitatii/${slug}/${id}`} />
        </div>
        <div className="flex flex-col gap-4">
          {results.items.map((item) => (
            <ListItem key={item.id} fields={item.fields} id={item.id} index={item.index} />
          ))}
        </div>
        <Pagination
          page={page}
          hasPreviousPage={page > 1}
          hasNextPage={page * perPage < results.total}
          pathname={`/licitatii/${slug}/${id}`}
        />
      </div>
    </div>
  );
}
