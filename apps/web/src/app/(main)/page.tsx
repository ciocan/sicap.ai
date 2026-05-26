import { connection } from "next/server";
import Link from "next/link";
import { Badge } from "@sicap/ui";
import { getCachedTotal } from "@/lib/cached-queries";
import { Search } from "@/components";
import { formatNumber } from "@/utils";

export default async function Page() {
  await connection();
  const { licitatii, achizitii, offline } = await getCachedTotal();

  return (
    <main className="my-auto p-2 sm:p-4 flex flex-col gap-2 items-center">
      <div className="flex flex-col gap-2 sm:gap-4">
        <h1 className="text-5xl sm:text-6xl text-center text-primary mb-4 sm:mb-6">
          <span className="font-bold">SICAP</span>.ai
        </h1>
        <h2 className="text-xs sm:text-sm text-center mb-1">
          <span className="font-mono font-bold">{formatNumber(licitatii)}</span> licitatii publice
          <span className="hidden sm:inline">, </span>
          <br className="sm:hidden" />
          <span className="font-mono font-bold">{formatNumber(achizitii)}</span> achizitii directe
          si <span className="font-mono font-bold">{formatNumber(offline)}</span> achizitii offline
        </h2>
      </div>
      <div className="px-2 max-w-lg w-full">
        <Search />
      </div>
      <div className="px-2 max-w-lg w-full mt-1 flex justify-center">
        <Link
          href="/mcp"
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Badge className="shrink-0">Nou</Badge>
          <span>
            Interoghează SICAP.ai din Claude și alți agenți AI prin{" "}
            <span className="font-medium text-foreground group-hover:text-primary">MCP</span>
          </span>
        </Link>
      </div>
    </main>
  );
}
