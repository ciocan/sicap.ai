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

  const db = searchParams.getAll("db");
  const dbValues = db.length > 0 ? db : dbIds;

  const paramsObj = Object.fromEntries(
    Array.from(searchParams.entries()).filter(([key]) => key !== "db")
  );

  const params = {
    ...paramsObj,
    ...(pathname === "/cauta" && { db: dbValues }),
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
