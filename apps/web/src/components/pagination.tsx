import Link from "next/link";

type PaginationProps = {
  query: string;
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function Pagination({ query, page, hasNextPage, hasPreviousPage }: PaginationProps) {
  const previousPage = page - 1;
  const nextPage = page + 1;

  return (
    <div className="text-sm space-x-4">
      {hasPreviousPage && (
        <Link
          href={{
            pathname: "/cauta",
            query: {
              q: query,
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
              q: query,
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
