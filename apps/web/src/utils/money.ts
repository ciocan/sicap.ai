/**
 * Compact Romanian-lei formatter for headline figures:
 *   12_294_042_595 -> "12,3 mld lei"   (miliarde)
 *   17_853_000     -> "17,9 mil. lei"  (milioane)
 *   17_853         -> "18 mii lei"     (mii)
 *   215            -> "215 lei"
 * Sign-preserving. For full grouped values in tables use `moneyRon`.
 */
export const moneyRonCompact = (value: number): string => {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const fmt = (x: number, max: number) =>
    x.toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: max });

  if (abs >= 1e9) {
    return `${fmt(n / 1e9, 1)} mld lei`;
  }
  if (abs >= 1e6) {
    return `${fmt(n / 1e6, 1)} mil. lei`;
  }
  if (abs >= 1e3) {
    return `${fmt(n / 1e3, 0)} mii lei`;
  }
  return `${fmt(n, 0)} lei`;
};
