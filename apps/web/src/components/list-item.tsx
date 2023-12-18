import Link from "next/link";
import { Building, Briefcase } from "lucide-react";

import { Card, CardHeader, CardContent, CardDescription, CardTitle, Badge } from "@sicap/ui";
import type { SearchItemDirect, SearchItemPublic, IndexName, SearchItemOffline } from "@sicap/api";
import { getDay, getMonth, getYear } from "@sicap/api";
import { ES_INDEX_DIRECT, ES_INDEX_PUBLIC, ES_INDEX_OFFLINE } from "@sicap/api/dist/es/utils.mjs";
import { moneyEur, moneyRon } from "@/utils";

interface ListItemProps {
  id: string;
  index: IndexName;
  fields: SearchItemPublic | SearchItemDirect | SearchItemOffline | undefined;
}

export function ListItem({ id, index, fields }: ListItemProps) {
  if (!fields) {
    return null;
  }

  const {
    date,
    value,
    name,
    code,
    cpvCode,
    cpvCodeAndName,
    contractingAuthorityName,
    contractingAuthorityId,
    localityAuthority,
    countyAuthority,
    supplierName,
    supplierId,
    localitySupplier,
    countySupplier,
    state,
    stateId,
    type,
  } = fields;

  const { procedureType, assigmentType } = fields as SearchItemPublic;

  const day = getDay(date);
  const month = getMonth(date);
  const year = getYear(date);

  const indexSlug = index.replace(/-directe|-publice/g, "");
  const contractLink = `/${indexSlug}/contract/${id}`;
  const cpvLink = `/${indexSlug}/cpv/${cpvCode}`;
  const ronValue = Number(value);
  const contractingAuthorityLink = `/${indexSlug}/autoritate/${contractingAuthorityId}`;
  const supplierLink = supplierId ? `/${indexSlug}/firma/${supplierId}` : "#";
  const indexText =
    index === ES_INDEX_DIRECT
      ? "Achizitie directa"
      : index === ES_INDEX_OFFLINE
      ? "Achizitie Offline"
      : "Licitatie publica";

  return (
    <Card className="flex flex-col sm:flex-row justify-between hover:bg-slate-50 hover:dark:bg-slate-800">
      <div>
        <CardHeader className="pb-4 space-y-2">
          <span className="text-xs text-primary">{indexText}</span>
          <Link href={contractLink} prefetch={false}>
            <CardTitle className="text-md font-normal">
              {code} - {name}
            </CardTitle>
          </Link>
          <CardDescription className="flex sm:flex-row flex-col gap-2">
            <Badge variant="secondary" className="font-mono">
              {moneyRon(ronValue)} / {moneyEur(ronValue)}
            </Badge>
            <Link href={cpvLink} prefetch={false}>
              <Badge variant="outline">{cpvCodeAndName}</Badge>
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          <Link href={contractingAuthorityLink} prefetch={false} className="py-2">
            <p className="flex items-center gap-2 text-sm">
              <span>
                <Building className="h-[1.2rem] w-[1.2rem] text-gray-500" />
              </span>
              <span>{contractingAuthorityName}</span>
            </p>
          </Link>
          <p className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Localitate:</span>
            <span>{localityAuthority ?? "-"}</span>
            <span className="text-gray-500">Judet:</span>
            <span>{countyAuthority ?? "-"}</span>
          </p>
          <Link href={supplierLink} prefetch={false} className="py-2">
            <p className="flex items-center gap-2 text-sm">
              <span>
                <Briefcase className="h-[1.2rem] w-[1.2rem] text-gray-500" />
              </span>
              <span>{supplierName ?? "-"}</span>
            </p>
          </Link>
          <p className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Localitate:</span>
            <span>{localitySupplier ?? "-"}</span>
            <span className="text-gray-500">Judet:</span>
            <span>{countySupplier ?? "-"}</span>
          </p>
        </CardContent>
        <CardContent className="flex sm:flex-row flex-col gap-2">
          {index === ES_INDEX_DIRECT && state && (
            <Badge variant={[5, 7].includes(stateId) ? "secondary" : "destructive"}>{state}</Badge>
          )}
          {index === ES_INDEX_PUBLIC && state && (
            <Badge variant={[3].includes(stateId) ? "destructive" : "secondary"}>{state}</Badge>
          )}
          {type && <Badge variant="secondary">{type}</Badge>}
          {procedureType && <Badge variant="outline">{procedureType}</Badge>}
          {assigmentType && <Badge variant="outline">{assigmentType}</Badge>}
        </CardContent>
      </div>
      <CardHeader className="flex justify-center sm:border-l-2 border-t-2 sm:border-t-0">
        <div className="flex gap-1 sm:flex-col text-center w-14">
          <span className="sm:text-2xl sm:text-primary font-mono">{day}</span>
          <span className="sm:text-md sm:uppercase">{month}</span>
          <span className="sm:text-sm font-mono">{year}</span>
        </div>
      </CardHeader>
    </Card>
  );
}
