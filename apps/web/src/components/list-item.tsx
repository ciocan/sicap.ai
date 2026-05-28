import Link from "next/link";
import { Building, Briefcase, ExternalLink, Users } from "lucide-react";

import { Card, CardHeader, CardContent, CardDescription, CardTitle, Badge } from "@sicap/ui";
import type { SearchItemDirect, SearchItemPublic, IndexName, SearchItemOffline } from "@sicap/api";
import { getDay, getMonth, getYear } from "@sicap/api";
import { ES_INDEX_DIRECT, ES_INDEX_PUBLIC, ES_INDEX_OFFLINE } from "@sicap/api/dist/es/utils.mjs";
import { getIndexSlug, moneyEur, moneyRon, slugify } from "@/utils";

interface ListItemProps {
  id: string;
  index: IndexName;
  fields: SearchItemPublic | SearchItemDirect | SearchItemOffline | undefined;
}

const indexConfig = {
  [ES_INDEX_DIRECT]: {
    text: "Achizitie directa",
    borderColor: "border-l-blue-500",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    dateColor: "text-blue-600 dark:text-blue-400",
  },
  [ES_INDEX_OFFLINE]: {
    text: "Achizitie Offline",
    borderColor: "border-l-amber-500",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    dateColor: "text-amber-600 dark:text-amber-400",
  },
  [ES_INDEX_PUBLIC]: {
    text: "Licitatie publica",
    borderColor: "border-l-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    dateColor: "text-emerald-600 dark:text-emerald-400",
  },
} as const;

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
    authorityFiscalNumber,
    localityAuthority,
    countyAuthority,
    supplierName,
    supplierFiscalNumber,
    localitySupplier,
    countySupplier,
    state,
    stateId,
    type,
    euFunds,
  } = fields;

  const { procedureType, assigmentType, winnersCount, awardedValue } = fields as SearchItemPublic;
  const hasMultipleWinners = index === ES_INDEX_PUBLIC && (winnersCount ?? 0) > 1;
  const showPartialValue =
    index === ES_INDEX_PUBLIC && awardedValue !== undefined && awardedValue !== Number(value);
  const awardedRon = showPartialValue ? (awardedValue as number) : 0;

  const day = getDay(date);
  const month = getMonth(date);
  const year = getYear(date);

  const indexSlug = getIndexSlug(index);
  const config = indexConfig[index];

  const contractLink = `/${indexSlug}/contract/${id}`;
  const cpvLink = `/${indexSlug}/cpv/${cpvCode}`;
  const ronValue = Number(value);
  const contractingAuthorityLink = authorityFiscalNumber
    ? `/autoritate/${authorityFiscalNumber}`
    : "#";
  const supplierLink = supplierFiscalNumber ? `/firma/${supplierFiscalNumber}` : "#";
  const authorityLocalityLink =
    localityAuthority && countyAuthority
      ? `/localitate/${slugify(countyAuthority)}/${slugify(localityAuthority)}`
      : null;
  const supplierLocalityLink =
    localitySupplier && countySupplier
      ? `/localitate/${slugify(countySupplier)}/${slugify(localitySupplier)}`
      : null;

  const contractTitle = `${code} - ${name}`;

  return (
    <Card
      className={`flex flex-col sm:flex-row justify-between border-l-[3px] ${config.borderColor} transition-all duration-200 ease-out hover:bg-slate-50/80 hover:shadow-md hover:dark:bg-slate-800/80`}
    >
      <div className="flex flex-col w-full">
        <CardHeader className="pb-3 space-y-3">
          {/* Type badge and EU funds row */}
          <div className="flex items-center gap-2 justify-between w-full">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.badgeClass} transition-colors`}
            >
              {config.text}
            </span>
            {euFunds && (
              <span className="text-xs text-primary font-medium truncate max-w-[200px]">
                {euFunds}
              </span>
            )}
          </div>

          {/* Contract title - clickable with truncation */}
          <Link href={contractLink} prefetch={false} className="group block">
            <CardTitle
              className="text-base font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors"
              title={contractTitle}
            >
              <span className="font-mono text-sm text-muted-foreground tracking-tight">{code}</span>
              <span className="mx-1.5 text-muted-foreground/50">—</span>
              <span>{name}</span>
            </CardTitle>
          </Link>

          {/* Value and CPV badges */}
          <CardDescription className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="font-mono text-sm font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-800"
              title={
                showPartialValue
                  ? `Cota firmei: ${moneyRon(awardedRon)} din ${moneyRon(ronValue)} valoare totala contract`
                  : undefined
              }
            >
              {moneyRon(showPartialValue ? awardedRon : ronValue)} /{" "}
              {moneyEur(showPartialValue ? awardedRon : ronValue)}
            </Badge>
            {showPartialValue && (
              <span className="font-mono text-xs text-muted-foreground">
                din {moneyRon(ronValue)} total
              </span>
            )}
            <Link
              href={cpvLink}
              prefetch={false}
              className="transition-transform hover:scale-[1.02] flex items-center group"
              target="_blank"
            >
              <Badge
                variant="outline"
                className="line-clamp-1 max-w-[280px] sm:max-w-none py-1 inline-flex items-center gap-1.5"
                title={cpvCodeAndName}
              >
                {cpvCodeAndName}
                <ExternalLink className="h-3 w-3 opacity-60 shrink-0" />
              </Badge>
            </Link>
          </CardDescription>
        </CardHeader>

        {/* Authority section */}
        <CardContent className="flex flex-col pt-0 pb-2">
          <Link
            href={contractingAuthorityLink}
            prefetch={false}
            className="group flex items-center gap-2 py-2.5 min-h-11 rounded-md -mx-2 px-2 transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-700/50"
            target="_blank"
          >
            <Building className="h-4 w-4 text-slate-400 shrink-0" />
            <span
              className="text-sm font-medium truncate group-hover:text-primary transition-colors"
              title={contractingAuthorityName}
            >
              {contractingAuthorityName}
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0 opacity-0 sm:group-hover:opacity-100 max-sm:opacity-60 transition-opacity ml-auto" />
          </Link>

          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-muted-foreground pl-6">
            <span className="flex items-center gap-1.5">
              <span className="text-slate-400">Localitate:</span>
              {authorityLocalityLink ? (
                <Link
                  href={authorityLocalityLink}
                  className="text-primary hover:underline inline-flex items-center gap-1"
                  target="_blank"
                  prefetch={false}
                >
                  {localityAuthority}
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </Link>
              ) : (
                <span>{localityAuthority ?? "-"}</span>
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-slate-400">Judet:</span>
              <span>{countyAuthority ?? "-"}</span>
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-0" />

          {/* Supplier section */}
          <Link
            href={supplierLink}
            prefetch={false}
            className="group flex items-center gap-2 py-2.5 min-h-11 rounded-md -mx-2 px-2 transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-700/50"
            target="_blank"
          >
            <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
            <span
              className="text-sm font-medium truncate group-hover:text-primary transition-colors"
              title={supplierName ?? undefined}
            >
              {supplierName ?? "-"}
            </span>
            {hasMultipleWinners && (
              <span
                className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300 shrink-0"
                title={`Contract atribuit la ${winnersCount} firme`}
              >
                <Users className="h-3 w-3" />+{(winnersCount as number) - 1}
              </span>
            )}
            <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0 opacity-0 sm:group-hover:opacity-100 max-sm:opacity-60 transition-opacity ml-auto" />
          </Link>

          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-muted-foreground pl-6">
            <span className="flex items-center gap-1.5">
              <span className="text-slate-400">Localitate:</span>
              {supplierLocalityLink ? (
                <Link
                  href={supplierLocalityLink}
                  className="text-primary hover:underline inline-flex items-center gap-1"
                  target="_blank"
                  prefetch={false}
                >
                  {localitySupplier}
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </Link>
              ) : (
                <span>{localitySupplier ?? "-"}</span>
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-slate-400">Judet:</span>
              <span>{countySupplier ?? "-"}</span>
            </span>
          </div>
        </CardContent>

        {/* Status badges */}
        <CardContent className="flex flex-wrap gap-2 pt-2">
          {index === ES_INDEX_DIRECT && state && (
            <Badge variant={[5, 7].includes(stateId) ? "secondary" : "destructive"}>{state}</Badge>
          )}
          {index === ES_INDEX_PUBLIC && state && (
            <Badge variant={[3].includes(stateId) ? "destructive" : "secondary"}>{state}</Badge>
          )}
          {index === ES_INDEX_OFFLINE && state && <Badge variant="secondary">{state}</Badge>}
          {type && <Badge variant="secondary">{type}</Badge>}
          {procedureType && <Badge variant="outline">{procedureType}</Badge>}
          {assigmentType && <Badge variant="outline">{assigmentType}</Badge>}
        </CardContent>
      </div>

      {/* Date section */}
      <CardHeader className="flex justify-center items-center sm:border-l border-t sm:border-t-0 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 sm:bg-transparent sm:dark:bg-transparent">
        <div className="flex items-center gap-1.5 sm:flex-col text-center sm:w-16 py-1">
          <span className={`text-2xl font-mono font-bold ${config.dateColor}`}>{day}</span>
          <span className="text-sm uppercase font-medium text-muted-foreground">{month}</span>
          <span className={`text-sm font-mono ${config.dateColor}`}>{year}</span>
        </div>
      </CardHeader>
    </Card>
  );
}
