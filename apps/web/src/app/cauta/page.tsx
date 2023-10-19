import { ListItem, Pagination } from "@/components";
import { searchContracts } from "@sicap/api";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
  params: { slug: string };
}

export default async function Page(props: PageProps) {
  const { searchParams } = props;
  const query = searchParams.q as string;
  const page = Number(searchParams.p || 1);
  const perPage = 20;

  console.log("searchParams", searchParams);

  const results = await searchContracts({ query, page, perPage });

  return (
    <main className="container px-8 py-4 flex flex-col gap-2 lg:max-w-7xl">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm">
          Pagina {page} din {results.total} rezultate pentru <b>{query}</b>
        </h3>
        <div className="flex flex-col gap-4">
          {results.items.map((item) => (
            <ListItem key={item.id} fields={item.fields} id={item.id} index={item.index} />
          ))}
        </div>
        <Pagination
          query={query}
          page={page}
          hasPreviousPage={page > 1}
          hasNextPage={page * perPage < results.total}
        />
      </div>
    </main>
  );
}
