import { Filter } from "lucide-react";

import { databases, dbIds } from "@/utils";
import { IndexName, searchContracts } from "@sicap/api";

import { ListItem } from "./list-item";
import { Pagination } from "./pagination";
import { PerPage } from "./per-page";

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
  supplier: string;
  localitySupplier: string;
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
    supplier,
    localitySupplier,
  } = searchParams;

  const dbs = ((Array.isArray(db) ? db : db?.split(",")) || dbIds) as IndexName[];
  const dbLabelsAsText = dbs.map((db) => databases.find((d) => d.id === db)?.label).join(", ");

  const filters = {
    db: dbs,
    dateFrom,
    dateTo,
    cpv,
    valueFrom,
    valueTo,
    authority,
    localityAuthority,
    supplier,
    localitySupplier,
  };

  const results = await searchContracts({ query, page, perPage, filters });

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm">
        Pagina {page} din {Intl.NumberFormat().format(results.total)} rezultate pentru{" "}
        <b>{query}</b>
      </h3>
      <div className="flex items-center gap-4 justify-between">
        <div className="flex flex-wrap items-center text-xs text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 p-2 rounded-md">
          <Filter className="h-[0.85rem] w-[0.85rem] mr-1" />
          <span className="font-semibold mr-1">Filtru:</span>
          <span className="mr-1">{dbLabelsAsText};</span>
          {dateFrom ||
          dateTo ||
          valueFrom ||
          valueTo ||
          authority ||
          cpv ||
          localityAuthority ||
          supplier ||
          localitySupplier ? (
            <>
              {dateFrom && <span className="mr-1">{`de la ${dateFrom}`}</span>}
              {dateTo && <span className="mr-1">{`până la ${dateTo};`}</span>}
              {cpv && <span className="mr-1">{`CPV: ${cpv};`}</span>}
              {authority && <span className="mr-1">{`autoritate: ${authority};`}</span>}
              {supplier && <span className="mr-1">{`furnizor: ${supplier};`}</span>}
              {valueFrom && (
                <span className="mr-1">{`valoare de la ${Intl.NumberFormat().format(
                  Number(valueFrom),
                )} RON`}</span>
              )}
              {valueTo && (
                <span className="mr-1">{`valoare până la ${Intl.NumberFormat().format(
                  Number(valueTo),
                )} RON`}</span>
              )}
              {localityAuthority && (
                <span className="mr-1">{`; localitate autoritate: ${localityAuthority}.`}</span>
              )}
              {localitySupplier && (
                <span className="mr-1">{`; localitate firma: ${localitySupplier}.`}</span>
              )}
            </>
          ) : null}
        </div>
        <div>
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
