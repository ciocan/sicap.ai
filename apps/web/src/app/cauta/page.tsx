import { Filter } from "lucide-react";

import { ListItem, Pagination, PerPage } from "@/components";
import { IndexName, searchContracts } from "@sicap/api";
import { databases, dbIds } from "@/utils";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
  params: { slug: string };
}

export async function generateMetadata({ searchParams }: PageProps) {
  const query = searchParams.q as string;

  return {
    title: `Cǎutare: "${query}"`,
    description: "Caută în baza de date a contractelor publice din România",
  };
}

export default async function Page(props: PageProps) {
  const { searchParams } = props;
  const query = searchParams.q as string;
  const page = Number(searchParams.p || 1);
  const perPage = Number(searchParams.perPage) || 20;
  const dbs = ((searchParams.db as string)?.split(",") || dbIds) as IndexName[];
  const dbLabelsAsText = dbs.map((db) => databases.find((d) => d.id === db)?.label).join(", ");
  const dateFrom = searchParams.dateFrom as string;
  const dateTo = searchParams.dateTo as string;
  const valueFrom = searchParams.valueFrom as string;
  const valueTo = searchParams.valueTo as string;
  const authority = searchParams.authority as string;
  const cpv = searchParams.cpv as string;
  const localityAuthority = searchParams.localityAuthority as string;
  const supplier = searchParams.supplier as string;
  const localitySupplier = searchParams.localitySupplier as string;

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
  // console.log(results.items[0].fields)

  return (
    <main className="container px-8 py-4 flex flex-col gap-2 lg:max-w-7xl">
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
    </main>
  );
}
