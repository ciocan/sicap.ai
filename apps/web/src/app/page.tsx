import { getTotal } from "@sicap/api";
import { Search } from "@/components";
import { formatNumber } from "@/utils";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function Page() {
  const { licitatii, achizitii, offline } = await getTotal();

  return (
    <main className="my-auto p-4 flex flex-col gap-2 items-center">
      <div className="flex flex-col gap-4">
        <h1 className="text-6xl text-center text-primary">
          <span className="font-bold">SICAP</span>.ai
        </h1>
        <h2 className="text-xs text-center">
          <span className="font-mono font-bold">{formatNumber(licitatii)}</span> licitatii publice, {" "}
          <span className="font-mono font-bold">{formatNumber(achizitii)}</span> achizitii directe
          si <span className="font-mono font-bold">{formatNumber(offline)}</span> achizitii
          offline
        </h2>
      </div>
      <div className="px-2 max-w-lg w-full">
        <Search />
      </div>
    </main>
  );
}
