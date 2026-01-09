import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";

import { getCachedLocalityStats } from "@/lib/cached-queries";
import { moneyRon } from "@/utils";
import { generateOpenGraph } from "@/utils/og";
import { LocalityContent } from "@/components/locality-content";
import { ChevronRight } from "lucide-react";

export type PageProps = {
  params: Promise<{
    county: string;
    city: string;
  }>;
};

// Helper to format display names from slugs
function formatDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function generateStaticParams() {
  return [{ county: "cluj", city: "cluj-napoca" }];
}

export async function generateMetadata(props: PageProps) {
  await connection();
  const params = await props.params;
  const city = formatDisplayName(params.city);
  const county = formatDisplayName(params.county);

  try {
    const stats = await getCachedLocalityStats({
      city,
      county,
    });

    const totalValueRon = moneyRon(stats.totalValue);
    const title = `${city}, ${county} - Achizitii Publice`;
    const description = `${stats.total} contracte in valoare de ${totalValueRon} | ${stats.uniqueAuthorities} autoritati contractante | ${stats.uniqueCompanies} firme`;

    return {
      title,
      description,
      ...generateOpenGraph({
        id: `${params.county}-${params.city}`,
        title,
        description,
        path: `/localitate/${params.county}/${params.city}`,
      }),
    };
  } catch {
    return {
      title: `${city}, ${county} - Achizitii Publice`,
      description: "Informatii despre achizitii publice in aceasta localitate",
    };
  }
}

function Breadcrumb({ county, city }: { county: string; city: string }) {
  const countyDisplay = formatDisplayName(county);
  const cityDisplay = formatDisplayName(city);

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link href="/" className="hover:text-foreground transition-colors">
        Romania
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-foreground">{countyDisplay}</span>
      <ChevronRight className="h-4 w-4" />
      <span className="text-foreground font-medium">{cityDisplay}</span>
    </nav>
  );
}

async function PageContent({ params }: { params: PageProps["params"] }) {
  const resolvedParams = await params;
  const city = formatDisplayName(resolvedParams.city);
  const county = formatDisplayName(resolvedParams.county);

  return <LocalityContent city={city} county={county} countySlug={resolvedParams.county} />;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;

  return (
    <main className="container px-8 py-4 flex flex-col gap-4 lg:max-w-7xl">
      <Breadcrumb county={resolvedParams.county} city={resolvedParams.city} />
      <Suspense fallback={<div className="text-sm">se incarca...</div>}>
        <PageContent params={params} />
      </Suspense>
    </main>
  );
}
