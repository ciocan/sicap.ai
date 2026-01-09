import { connection } from "next/server";
import { getCachedCompanyTopAuthorities } from "@/lib/cached-queries";
import { TopAuthoritiesList } from "./top-authorities-list";
import { TopAuthoritiesCharts } from "./top-authorities-charts";

interface TopAuthoritiesProps {
  nationalId: string;
}

export async function TopAuthorities({ nationalId }: TopAuthoritiesProps) {
  await connection();
  let authorities: Awaited<ReturnType<typeof getCachedCompanyTopAuthorities>> = [];

  try {
    authorities = await getCachedCompanyTopAuthorities({ nationalId, limit: 10 });
  } catch {
    return null;
  }

  if (authorities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Top 10 Autoritati - Ultimele 12 luni</h3>
        <p className="text-sm text-muted-foreground">
          Autoritati contractante cu cele mai mari contracte in ultimul an
        </p>
      </div>

      <TopAuthoritiesCharts authorities={authorities} />
      <TopAuthoritiesList authorities={authorities} />
    </div>
  );
}
