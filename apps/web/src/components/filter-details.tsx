"use client";
import { Filter } from "lucide-react";
import { useState } from "react";

import { databases, dbIds, moneyRon } from "@/utils";
import type { IndexName, SearchStatusOption } from "@sicap/api";
import type { SearchParams } from "./search-list";
import { Dialog, DialogTrigger } from "@sicap/ui";
import { AdvancedSearch } from "./search-advanced";

interface FilterDetailsProps {
  searchParams: SearchParams;
  statusOptions: SearchStatusOption[];
}

export function FilterDetails({ searchParams, statusOptions }: FilterDetailsProps) {
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
    euFunds,
    status,
  } = searchParams;

  const dbs = ((Array.isArray(db) ? db : db?.split(",")) || dbIds) as IndexName[];
  const dbLabelsAsText = dbs.map((db) => databases.find((d) => d.id === db)?.label).join(", ");
  const statusTokens = new Set(
    ((Array.isArray(status) ? status : status?.split(",")) ?? []).filter(Boolean),
  );
  const selectedStatuses = statusOptions.filter((option) => statusTokens.has(option.token));
  const statusLabelsAsText = selectedStatuses
    .map((option) => {
      const databaseLabel = databases.find((database) => database.id === option.index)?.label;
      return databaseLabel ? `${databaseLabel}: ${option.label}` : option.label;
    })
    .join(", ");
  const showStatusSummary =
    selectedStatuses.length > 0 && selectedStatuses.length < statusOptions.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
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
          localitySupplier ||
          euFunds ||
          showStatusSummary ? (
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
              {euFunds === "true" && <span className="mr-1">Fonduri Europene: DA.</span>}
              {showStatusSummary && <span className="mr-1">{`Status: ${statusLabelsAsText}.`}</span>}
            </>
          ) : null}
        </button>
      </DialogTrigger>
      <AdvancedSearch query={q} setOpen={setOpen} statusOptions={statusOptions} />
    </Dialog>
  );
}
