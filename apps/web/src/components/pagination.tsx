"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { dbIds } from "@/utils";

type PaginationProps = {
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function Pagination({ page, hasNextPage, hasPreviousPage }: PaginationProps) {
  const searchParams = useSearchParams();
  const db = searchParams.get("db");

  const params = {
    ...Object.fromEntries(searchParams.entries()),
    db: db ?? dbIds,
  };

  const previousPage = page - 1;
  const nextPage = page + 1;

  return (
    <div className="text-sm space-x-4">
      {hasPreviousPage && (
        <Link
          href={{
            pathname: "/cauta",
            query: {
              ...params,
              p: previousPage,
            },
          }}
        >
          pagina precedenta
        </Link>
      )}
      {hasNextPage && (
        <Link
          href={{
            pathname: "/cauta",
            query: {
              ...params,
              p: nextPage,
            },
          }}
        >
          pagina urmatoare
        </Link>
      )}
    </div>
  );
}
