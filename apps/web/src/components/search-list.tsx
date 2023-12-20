import { dbIds, formatNumber } from "@/utils";
import { IndexName, searchContracts } from "@sicap/api";

import { ListItem } from "./list-item";
import { Pagination } from "./pagination";
import { PerPage } from "./per-page";
import { FilterDetails } from "./filter-details";
import { CSVDownload } from "./csv-download";

export interface SearchParams {
  q: string;
  p: number;
  perPage: number;
  db: string;
  dateFrom: string;
  dateTo: string;
  valueFrom: string;
  valueTo: string;
  authority: string;
  cpv: string;
  localityAuthority: string;
  countyAuthority: string;
  supplier: string;
  localitySupplier: string;
  countySupplier: string;
  isFiscal?: string;
}

interface SearchListProps {
  searchParams: SearchParams;
}

export async function SearchList({ searchParams }: SearchListProps) {
  const {
    q: query,
    p: page = 1,
    perPage = 20,
    db,
    dateFrom,
    dateTo,
    valueFrom,
    valueTo,
    authority,
    cpv,
    localityAuthority,
    countyAuthority,
    supplier,
    localitySupplier,
    countySupplier,
  } = searchParams;

  const dbs = ((Array.isArray(db) ? db : db?.split(",")) || dbIds) as IndexName[];

  const filters = {
    db: dbs,
    dateFrom,
    dateTo,
    cpv,
    valueFrom,
    valueTo,
    authority,
    localityAuthority,
    countyAuthority,
    supplier,
    localitySupplier,
    countySupplier,
  };

  const results = await searchContracts({ query, page, perPage, filters });

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm">
        Pagina {page} din {formatNumber(results.total)} rezultate pentru <b>{query}</b>
      </h3>
      <div className="flex items-center gap-4 justify-between">
        <FilterDetails searchParams={searchParams} />
        <div className="flex gap-2">
          <CSVDownload items={results.items} />
          <PerPage total={perPage} />
        </div>
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
      />
    </div>
  );
}
