import { searchContracts } from "@sicap/api";
interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
  params: { slug: string };
}

export default async function Page(props: PageProps) {
  const { searchParams } = props;
  const query = searchParams.q as string;
  const results = await searchContracts({ query });
  // console.log(results)
  console.log(results.hits[0]);

  return (
    <main className="container px-8 py-4 flex flex-col gap-2 lg:max-w-7xl">
      <div className="flex flex-col gap-4">
        <h3>cauta: {query}</h3>
      </div>
    </main>
  );
}
