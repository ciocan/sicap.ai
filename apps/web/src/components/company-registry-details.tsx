import { type CompanyRegistry, companyActivities } from "@sicap/api";
import { Badge } from "@sicap/ui";

import { CompanyActivities } from "./company-activities";

// Secondary ONRC registry detail shown under the financials in the "Date financiare" tab:
// the full authorized-activity (CAEN) list, branches, and the registration lineage.
export function CompanyRegistryDetails({ registry }: { registry: CompanyRegistry }) {
  const { canonical, history } = registry;
  const activities = companyActivities(canonical.activitati);
  const branches = canonical.sucursale ?? [];

  if (activities.length === 0 && branches.length === 0 && history.length === 0) {
    return null;
  }

  return (
    <>
      {activities.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-semibold">Activități autorizate (CAEN)</h3>
          <CompanyActivities activities={activities} />
        </section>
      )}

      {branches.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-semibold">Sucursale</h3>
          <ul className="space-y-1 text-sm">
            {branches.map((branch) => (
              <li key={`${branch.cod_fiscal ?? ""}-${branch.denumire ?? ""}`}>
                <span>{branch.denumire ?? "Sucursală"}</span>
                {branch.tip_unitate ? (
                  <span className="text-muted-foreground"> · {branch.tip_unitate}</span>
                ) : null}
                {branch.cod_fiscal ? (
                  <span className="font-mono text-muted-foreground"> · {branch.cod_fiscal}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {history.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-semibold">Istoric înregistrări</h3>
          <ul className="space-y-2 text-sm">
            {history.map((reg) => (
              <li
                key={reg.cod_inmatriculare}
                className="flex flex-wrap items-center gap-x-2 gap-y-1"
              >
                <span className="font-mono text-muted-foreground">{reg.cod_inmatriculare}</span>
                <span>{reg.denumire}</span>
                {reg.data_inmatriculare ? (
                  <span className="font-mono text-muted-foreground">
                    {reg.data_inmatriculare.slice(0, 4)}
                  </span>
                ) : null}
                {reg.is_radiata && <Badge variant="destructive">Radiată</Badge>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
