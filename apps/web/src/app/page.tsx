import { getTotal } from "@sicap/api";

export default async function Page() {
  const { licitatii, achizitii } = await getTotal();

  return (
    <main className="flex flex-col items-center justify-between p-24">
      <h1>sicap.ai</h1>
      <div>
        <h4 className="text-sm">{licitatii} licitatii publice si {achizitii} achizitii directe indexate</h4>
      </div>
    </main>
  );
}
