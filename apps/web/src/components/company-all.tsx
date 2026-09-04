import { notFound } from "next/navigation";
import { connection } from "next/server";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@sicap/ui";

import {
  getCachedCompanyByNationalId,
  getCachedCompanyFinancials,
  getCachedCompanyRegistry,
} from "@/lib/cached-queries";

import { formatNumber, moneyEur, moneyRon } from "@/utils";
import type { SearchParams } from "./search-list";
import { ListItem } from "./list-item";
import { Pagination } from "./pagination";
import { Chart } from "./chart";
import { CompanyProfileBand } from "./company-profile-band";
import { CompanyFinancials } from "./company-financials";
import { CompanyRegistryDetails } from "./company-registry-details";
import { PerPage } from "./per-page";
import { CSVDownload } from "./csv-download";
import { TopAuthorities } from "./top-authorities";
import { ShareMethodologyTooltip } from "./share-methodology-tooltip";
import { HartaFirmelorCard } from "./harta-firmelor-card";

interface CompanyAllProps {
  nationalId: string;
  searchParams: SearchParams;
}

export async function CompanyAll({ nationalId, searchParams }: CompanyAllProps) {
  await connection();
  const { p: page = 1, perPage = 20 } = searchParams;

  let results: Awaited<ReturnType<typeof getCachedCompanyByNationalId>>;
  let registry: Awaited<ReturnType<typeof getCachedCompanyRegistry>> = null;
  let financials: Awaited<ReturnType<typeof getCachedCompanyFinancials>> = null;
  try {
    // Procurement query drives notFound; ONRC/financials enrichment degrades to null.
    [results, registry, financials] = await Promise.all([
      getCachedCompanyByNationalId({ nationalId, page, perPage }),
      getCachedCompanyRegistry(nationalId).catch(() => null),
      getCachedCompanyFinancials(nationalId).catch(() => null),
    ]);
  } catch {
    return notFound();
  }

  const { total, company, stats, nonAwarded } = results;

  const totalValue = stats?.years?.map((y) => y.value).reduce((a, b) => a + b, 0);
  const totalValueRon = moneyRon(totalValue);
  const totalValueEur = moneyEur(totalValue);

  const nonAwardedValueRon = moneyRon(nonAwarded?.value);
  const nonAwardedValueEur = moneyEur(nonAwarded?.value);

  return (
    <div className="space-y-8">
      {/* Identity (trade registry) — page header above the tabs. */}
      <CompanyProfileBand
        registry={registry}
        nationalId={nationalId}
        mainCaen={financials?.latest?.caen}
        fallbackName={company?.entityName}
        fallbackCity={company?.city}
        fallbackCounty={company?.county}
      />

      {/* Trade-registry snapshot from harta-firmelor.ro. The framed document is
          noindex,nofollow, so the outbound link is rebuilt in our own HTML. */}
      <HartaFirmelorCard nationalId={nationalId} />

      {/* Detail split by source: procurement (e-licitatie) vs company record (ONRC). */}
      <Tabs defaultValue="achizitii" className="gap-4">
        <TabsList>
          <TabsTrigger value="achizitii">Achiziții publice</TabsTrigger>
          <TabsTrigger value="firma">Date financiare</TabsTrigger>
        </TabsList>

        <TabsContent value="achizitii" className="space-y-6">
          <p className="text-xs text-muted-foreground">Date din e-licitatie.ro</p>

          <div className="space-y-1">
            <div className="text-sm">
              {formatNumber(total)} contracte atribuite în valoare de{" "}
              <span className="text-primary font-mono">{totalValueRon}</span> /{" "}
              <span className="font-mono">{totalValueEur}</span> <ShareMethodologyTooltip />
            </div>
            {nonAwarded && nonAwarded.total > 0 && (
              <p className="text-sm text-muted-foreground">
                {formatNumber(nonAwarded.total)} contracte neatribuite în valoare de{" "}
                <span className="font-mono">{nonAwardedValueRon}</span> /{" "}
                <span className="font-mono">{nonAwardedValueEur}</span>
              </p>
            )}
          </div>

          <Chart stats={stats} nonAwardedStats={nonAwarded?.stats} />
          <TopAuthorities nationalId={nationalId} />
        </TabsContent>

        <TabsContent value="firma" className="space-y-8">
          <p className="text-xs text-muted-foreground">
            Date din Registrul Comerțului și Ministerul Finanțelor
          </p>

          <section className="space-y-4">
            <h3 className="text-base font-semibold">Situație financiară</h3>
            {financials !== null && financials.years.length > 0 ? (
              <CompanyFinancials financials={financials} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Nu există situații financiare publicate.
              </p>
            )}
          </section>

          {registry !== null && <CompanyRegistryDetails registry={registry} />}
        </TabsContent>
      </Tabs>

      {/* Contract list — always visible, outside the tabs. */}
      <section className="space-y-4 border-t pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Contracte</h2>
            <p className="text-xs text-muted-foreground">
              Pagina {page} din {formatNumber(results.total)} rezultate
            </p>
          </div>
          <div className="flex gap-2">
            <CSVDownload items={results.items} />
            <PerPage total={perPage} pathname={`/firma/${nationalId}`} />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {results.items.map((item) => (
            <ListItem key={item.id!} fields={item.fields} id={item.id!} index={item.index} />
          ))}
        </div>
        <Pagination
          page={page}
          hasPreviousPage={page > 1}
          hasNextPage={page * perPage < results.total}
          pathname={`/firma/${nationalId}`}
        />
      </section>
    </div>
  );
}
