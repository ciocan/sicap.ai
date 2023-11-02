"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { dbIds } from "@/utils";

type PaginationProps = {
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pathname?: string;
};

export function Pagination({
  page,
  hasNextPage,
  hasPreviousPage,
  pathname = "/cauta",
}: PaginationProps) {
  const searchParams = useSearchParams();
  const db = searchParams.get("db") ?? dbIds;

  const params = {
    ...Object.fromEntries(searchParams.entries()),
    ...(pathname === "/cauta" && { db }),
  };

  const previousPage = Number(page) - 1;
  const nextPage = Number(page) + 1;

  return (
    <div className="text-sm space-x-4">
      {hasPreviousPage && (
        <Link
          href={{
            pathname,
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
            pathname,
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
