"use client";
import { Filter } from "lucide-react";

import { databases, dbIds, moneyRon } from "@/utils";
import { IndexName } from "@sicap/api";
import { SearchParams } from "./search-list";
import { Dialog, DialogTrigger } from "@sicap/ui";
import { AdvancedSearch } from "./search-advanced";
import { useState } from "react";

export function FilterDetails({ searchParams }: { searchParams: SearchParams }) {
  const [open, setOpen] = useState(false);

  const {
    q,
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
  const dbLabelsAsText = dbs.map((db) => databases.find((d) => d.id === db)?.label).join(", ");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div
          role="button"
          className="flex flex-wrap items-center text-xs text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 p-2 rounded-md cursor-pointer"
        >
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
          countyAuthority ||
          countySupplier ||
          supplier ||
          localitySupplier ? (
            <>
              {dateFrom && <span className="mr-1">{`de la ${dateFrom}`}</span>}
              {dateTo && <span className="mr-1">{`până la ${dateTo};`}</span>}
              {cpv && <span className="mr-1">{`CPV: ${cpv};`}</span>}
              {authority && <span className="mr-1">{`autoritate: ${authority};`}</span>}
              {supplier && <span className="mr-1">{`furnizor: ${supplier};`}</span>}
              {valueFrom && <span className="mr-1">{`valoare de la ${moneyRon(valueFrom)}`}</span>}
              {valueTo && <span className="mr-1">{`valoare până la ${moneyRon(valueTo)}`}</span>}
              {localityAuthority && (
                <span className="mr-1">{`; localitate autoritate: ${localityAuthority}.`}</span>
              )}
              {countyAuthority && (
                <span className="mr-1">{`; judet autoritate: ${countyAuthority}.`}</span>
              )}
              {localitySupplier && (
                <span className="mr-1">{`; localitate firma: ${localitySupplier}.`}</span>
              )}
              {countySupplier && (
                <span className="mr-1">{`; judet firma: ${countySupplier}.`}</span>
              )}
            </>
          ) : null}
        </div>
      </DialogTrigger>
      <AdvancedSearch query={q} setOpen={setOpen} />
    </Dialog>
  );
}
