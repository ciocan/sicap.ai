import { getCachedTotal } from "@/lib/cached-queries";
import { formatNumber } from "@/utils";

export async function TotalsDisplay() {
  const totals = await getCachedTotal();
  const licitatii = formatNumber(totals.licitatii);
  const achizitii = formatNumber(totals.achizitii);
  const offline = formatNumber(totals.offline);

  return (
    <span>
      <strong>
        <em>{licitatii}</em> licitatii publice
      </strong>
      ,{" "}
      <strong>
        <em>{achizitii}</em> achizitii directe
      </strong>{" "}
      si{" "}
      <strong>
        <em>{offline}</em> achizitii offline
      </strong>
    </span>
  );
}
