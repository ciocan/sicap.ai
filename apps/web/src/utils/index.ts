import { ES_INDEX_DIRECT, ES_INDEX_PUBLIC } from "@sicap/api/dist/es/utils.mjs";

export const allowedSlugs = ["firma", "autoritate", "cpv"];

export const databases = [
  {
    id: ES_INDEX_PUBLIC,
    label: "Licitatii publice",
  },
  {
    id: ES_INDEX_DIRECT,
    label: "Achizitii directe",
  },
] as const;

export const dbIds = databases.map((d) => d.id);

export const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const formatNumber = (n: number) => n.toLocaleString("ro-RO");

const EURO = 5; // 1 EUR = 5 RON

export const moneyRon = (value) =>
  new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    minimumFractionDigits: 0,
  }).format(value);

export const moneyEur = (value) =>
  new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "EUR",
  }).format(eur(value));

export const eur = (v) => Number(v) / EURO;

export const getInitials = (fullName: string): string => {
  const names = fullName.split(" ");
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  const initials =
    names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
  return initials;
};
