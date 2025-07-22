interface ErrorPageProps {
  searchParams?: Promise<{
    error?: string;
  }>;
}

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const { error } = (await searchParams) || {};
  return (
    <div className="grid flex-1 place-items-center p-8">
      <div className="space-y-2">
        <h1 className="font-bold text-3xl text-red-600 text-center">Erorare!</h1>
        <h2 className="">{error}</h2>
      </div>
    </div>
  );
}
