export default function ErrorPage(props) {
  const { searchParams } = props;
  return (
    <div className="grid flex-1 place-items-center p-8">
      <div className="space-y-2">
        <h1 className="font-bold text-3xl text-red-600 text-center">Erorare!</h1>
        <h2 className="">{searchParams?.error}</h2>
      </div>
    </div>
  );
}
