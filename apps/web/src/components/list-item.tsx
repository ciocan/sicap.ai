import Link from "next/link";
import { Building, Briefcase } from "lucide-react";

import { Card, CardHeader, CardContent, CardDescription, CardTitle, Badge } from "@sicap/ui";
import type { SearchItemDirect, SearchItemPublic, IndexName } from "@sicap/api";
import { getDay, getMonth, getYear } from "@sicap/api/dist/utils/date";
import { ES_INDEX_DIRECT } from "@sicap/api";

interface ListItemProps {
  id: string;
  index: IndexName;
  fields: SearchItemPublic | SearchItemDirect | undefined;
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
    contractingAuthorityName,
    contractingAuthorityId,
    supplierName,
    supplierId,
  } = fields;
  const day = getDay(date);
  const month = getMonth(date);
  const year = getYear(date);

  const indexSlug = index.replace(/-directe|-publice/g, "");
  const contractLink = `/${indexSlug}/contract/${id}`;
  const cpvLink = `/${indexSlug}/cpv/${id}`;
  const ronValue = Intl.NumberFormat().format(Number(value));
  const eurValue = Intl.NumberFormat().format(Number(value) / 5);
  const contractingAuthorityLink = `/${indexSlug}/autoritate/${contractingAuthorityId}`;
  const supplierLink = `/${indexSlug}/firma/${supplierId}`;
  const indexText = index === ES_INDEX_DIRECT ? "Achizitie directa" : "Licitatie publica";

  return (
    <Card className="flex flex-col sm:flex-row justify-between hover:bg-slate-50 hover:dark:bg-slate-800">
      <div>
        <CardHeader>
          <span className="text-xs text-primary">{indexText}</span>
          <Link href={contractLink} target="_blank">
            <CardTitle className="text-md font-normal">
              {code} - {name}
            </CardTitle>
          </Link>
          <CardDescription>
            <Badge variant="secondary" className="my-2 mr-2">
              {ronValue} RON / {eurValue} EUR
            </Badge>
            <Link href={cpvLink} target="_blank">
              <Badge variant="outline">{cpvCode}</Badge>
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Link href={contractingAuthorityLink} target="_blank">
            <p className="flex items-center gap-2 text-sm">
              <span>
                <Building className="h-[1.2rem] w-[1.2rem] text-gray-500" />
              </span>
              <span>{contractingAuthorityName}</span>
            </p>
          </Link>
          <Link href={supplierLink} target="_blank">
            <p className="flex items-center gap-2 text-sm">
              <span>
                <Briefcase className="h-[1.2rem] w-[1.2rem] text-gray-500" />
              </span>
              <span>{supplierName}</span>
            </p>
          </Link>
        </CardContent>
      </div>
      <CardHeader className="flex justify-center sm:border-l-2 border-t-2 sm:border-t-0">
        <div className="flex gap-1 sm:flex-col text-center w-14">
          <span className="sm:text-2xl sm:text-primary">{day}</span>
          <span className="sm:text-md sm:uppercase">{month}</span>
          <span className="sm:text-sm">{year}</span>
        </div>
      </CardHeader>
    </Card>
  );
}
