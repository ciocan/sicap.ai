interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
  params: { slug: string };
}

export default async function Page(props: PageProps) {
  const { searchParams } = props;
  const q = searchParams.q;

  return (
    <main className="container px-8 py-4 flex flex-col gap-2 lg:max-w-7xl">
      <div className="flex flex-col gap-4">
        <h3>cauta: {q}</h3>
      </div>
    </main>
  );
}
