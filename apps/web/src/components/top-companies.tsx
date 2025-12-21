import { getCachedAuthorityTopSuppliers } from "@/lib/cached-queries";
import { TopCompaniesList } from "./top-companies-list";
import { TopCompaniesCharts } from "./top-companies-charts";

interface TopCompaniesProps {
  nationalId: string;
}

export async function TopCompanies({ nationalId }: TopCompaniesProps) {
  let suppliers: Awaited<ReturnType<typeof getCachedAuthorityTopSuppliers>> = [];

  try {
    suppliers = await getCachedAuthorityTopSuppliers({ nationalId, limit: 10 });
  } catch {
    return null;
  }

  if (suppliers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Top 10 Firme - Ultimele 12 luni</h3>
        <p className="text-sm text-muted-foreground">
          Furnizori cu cele mai mari contracte in ultimul an
        </p>
      </div>

      <TopCompaniesCharts suppliers={suppliers} />
      <TopCompaniesList suppliers={suppliers} />
    </div>
  );
}

