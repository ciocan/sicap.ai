import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { getRepresentativeLinks, type OnrcRepresentative } from "@sicap/api";

// Romanian count agreement: 1 → "o firmă", 2–19 → "N firme", ≥20 → "N de firme".
function firmeLabel(n: number): string {
  if (n === 1) {
    return "o firmă";
  }
  return n < 20 ? `${n} firme` : `${n} de firme`;
}

/**
 * Shown in the identity band directly under the representatives line: for each legal
 * representative, the OTHER companies the same natural person represents that have procurement
 * contracts — a bounded people-graph linking administrators across firms. Each row is a
 * self-describing disclosure ("NAME · și la N firme cu contracte"), so no section heading is
 * needed in the band. The date of birth disambiguates people who share a name but is never
 * rendered. Returns null when no representative links to a company with contracts.
 */
export async function CompanyRepresentativeLinks({
  reprezentanti,
  reprezentantiIf,
  cui,
}: {
  reprezentanti?: OnrcRepresentative[];
  reprezentantiIf?: OnrcRepresentative[];
  cui: string;
}) {
  const links = await getRepresentativeLinks(reprezentanti, reprezentantiIf, cui);
  if (links.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-1 text-sm">
      {links.map((link) => (
        <li key={link.key}>
          <details className="group">
            <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <ChevronRight className="size-3.5 shrink-0 transition-transform duration-200 group-open:rotate-90" />
              <span className="text-foreground">{link.nume}</span>
              <span>· și la {firmeLabel(link.companies.length)} cu contracte</span>
            </summary>
            <ul className="mt-1 space-y-1 pl-5">
              {link.companies.map((company) => (
                <li key={company.cui}>
                  <Link href={`/firma/${company.cui}`} className="text-primary hover:underline">
                    {company.denumire}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </li>
      ))}
    </ul>
  );
}
