export const databases = [
  {
    id: "licitatii",
    label: "Licitatii publice",
  },
  {
    id: "achizitii",
    label: "Achizitii directe",
  },
] as const;

export const dbLabels = databases.map((d) => d.id);

export const wait = () => new Promise((resolve) => setTimeout(resolve, 250));
