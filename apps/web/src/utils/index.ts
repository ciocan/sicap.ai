import { ES_INDEX_DIRECT, ES_INDEX_PUBLIC } from "@sicap/api/dist/es/utils";

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

export const wait = () => new Promise((resolve) => setTimeout(resolve, 250));
