"use client";

import Link from "next/link";
import { Building, Briefcase, Search, ExternalLink, Calendar } from "lucide-react";
import type { Route } from "next";

import { Card, Badge, Separator } from "@sicap/ui";
import type { SearchItemDirect, SearchItemPublic, IndexName, SearchItemOffline } from "@sicap/api";
import { getDay, getMonth, getYear } from "@sicap/api/utils/date";
import { ES_INDEX_DIRECT, ES_INDEX_PUBLIC, ES_INDEX_OFFLINE } from "@sicap/api/browser/constants";
import { getIndexSlug, moneyEur, moneyRon } from "@/utils";

interface SearchResult {
  id: string;
  index: string;
  fields: SearchItemPublic | SearchItemDirect | SearchItemOffline;
}

interface SearchResultsProps {
  took: number;
  total: number;
  items: SearchResult[];
}

function SearchResultItem({ id, index, fields }: SearchResult) {
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
    euFunds,
  } = fields;

  const { procedureType, assigmentType } = fields as SearchItemPublic;

  const day = getDay(date);
  const month = getMonth(date);
  const year = getYear(date);

  const indexSlug = getIndexSlug(index as IndexName);

  const contractLink = `/${indexSlug}/contract/${id}` as Route;
  const cpvLink = `/${indexSlug}/cpv/${cpvCode}` as Route;
  const ronValue = Number(value);
  const contractingAuthorityLink = `/${indexSlug}/autoritate/${contractingAuthorityId}` as Route;
  const supplierLink = (supplierId ? `/${indexSlug}/firma/${supplierId}` : "#") as Route;

  const indexText =
    index === ES_INDEX_DIRECT
      ? "Achizitie directa"
      : index === ES_INDEX_OFFLINE
        ? "Achizitie Offline"
        : "Licitatie publica";

  return (
    <Card className="p-3 hover:bg-muted/50 transition-colors border-l-4 border-l-primary/20">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs shrink-0">
              {indexText}
            </Badge>
            {euFunds && (
              <Badge variant="outline" className="text-xs shrink-0">
                {euFunds}
              </Badge>
            )}
          </div>
          <Link
            href={contractLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1 hover:text-primary"
          >
            <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:underline">
              {code} - {name}
            </h3>
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
        </div>

        <div className="flex items-center gap-1 text-right shrink-0">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <div className="text-xs">
            <div className="font-mono font-semibold">{day}</div>
            <div className="text-muted-foreground uppercase">{month}</div>
            <div className="text-muted-foreground">{year}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant="secondary" className="font-mono text-xs">
          {moneyRon(ronValue)} / {moneyEur(ronValue)}
        </Badge>
        <Link
          href={cpvLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:bg-muted rounded px-2 py-1 line-clamp-1"
        >
          <Badge variant="outline" className="text-xs">
            {cpvCodeAndName}
          </Badge>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <Separator className="my-2" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <Link
            href={contractingAuthorityLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 p-2 -m-2 rounded hover:bg-muted/50"
          >
            <Building className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="font-medium group-hover:text-primary group-hover:underline truncate">
                {contractingAuthorityName}
              </div>
              <div className="text-muted-foreground">
                {localityAuthority && `${localityAuthority}, `}
                {countyAuthority}
              </div>
            </div>
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
        </div>

        <div className="space-y-1">
          <Link
            href={supplierLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 p-2 -m-2 rounded hover:bg-muted/50"
          >
            <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="font-medium group-hover:text-primary group-hover:underline truncate">
                {supplierName || "Nu este specificat"}
              </div>
              <div className="text-muted-foreground">
                {localitySupplier && `${localitySupplier}, `}
                {countySupplier}
              </div>
            </div>
            {supplierId && (
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            )}
          </Link>
        </div>
      </div>

      {(state || type || procedureType || assigmentType) && (
        <>
          <Separator className="my-2" />
          <div className="flex flex-wrap gap-1">
            {index === ES_INDEX_DIRECT && state && (
              <Badge
                variant={[5, 7].includes(stateId) ? "secondary" : "destructive"}
                className="text-xs"
              >
                {state}
              </Badge>
            )}
            {index === ES_INDEX_PUBLIC && state && (
              <Badge
                variant={[3].includes(stateId) ? "destructive" : "secondary"}
                className="text-xs"
              >
                {state}
              </Badge>
            )}
            {index === ES_INDEX_OFFLINE && state && (
              <Badge variant="secondary" className="text-xs">
                {state}
              </Badge>
            )}
            {type && (
              <Badge variant="secondary" className="text-xs">
                {type}
              </Badge>
            )}
            {procedureType && (
              <Badge variant="outline" className="text-xs">
                {procedureType}
              </Badge>
            )}
            {assigmentType && (
              <Badge variant="outline" className="text-xs">
                {assigmentType}
              </Badge>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

export function SearchResults({ took, total, items }: SearchResultsProps) {
  if (!items?.length) {
    return (
      <Card className="p-3">
        <div className="flex items-center gap-2 text-center justify-center">
          <Search className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-sm font-medium">Nu s-au găsit rezultate</span>
            <span className="text-xs text-muted-foreground ml-1">
              - încercați să modificați criteriile de căutare
            </span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="p-3 bg-muted/30">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span>
              <strong className="text-foreground">{total.toLocaleString()}</strong> rezultate găsite
            </span>
          </div>
          {took && (
            <Badge variant="outline" className="text-xs">
              {took}ms
            </Badge>
          )}
        </div>
      </Card>

      <div className="space-y-2">
        {items.map((item) => (
          <SearchResultItem key={item.id} {...item} />
        ))}
      </div>

      {items.length < total && (
        <Card className="p-2 bg-muted/20">
          <p className="text-center text-xs text-muted-foreground">
            Se afișează {items.length} din {total.toLocaleString()} rezultate
          </p>
        </Card>
      )}
    </div>
  );
}
