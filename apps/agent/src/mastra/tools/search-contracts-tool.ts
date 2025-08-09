import { createTool } from "@mastra/core";
import { z } from "zod";

import { searchContracts } from "@sicap/api";

const inputSchema = z.object({
  query: z.string().optional().describe("Textul de căutare introdus de utilizator"),
  page: z.number().int().min(1).optional().default(1).describe("Pagina de rezultate (implicit 1)"),
  perPage: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .describe("Numărul de rezultate pe pagină (implicit 20, maxim 100)"),
  db: z
    .array(z.enum(["licitatii-publice", "achizitii-directe", "achizitii-offline"]))
    .default(["licitatii-publice", "achizitii-directe", "achizitii-offline"])
    .describe(
      "Baza de date selectată pentru căutare (ex: licitații publice, achiziții directe, achiziții offline)",
    ),
  dateFrom: z.string().optional().describe("Data de început pentru filtrarea rezultatelor"),
  dateTo: z.string().optional().describe("Data de sfârșit pentru filtrarea rezultatelor"),
  valueFrom: z.string().optional().describe("Valoarea minimă a contractului"),
  valueTo: z.string().optional().describe("Valoarea maximă a contractului"),
  authority: z.string().optional().describe("Autoritatea contractantă"),
  cpv: z.string().optional().describe("Codul CPV pentru filtrarea rezultatelor"),
  localityAuthority: z.string().optional().describe("Localitatea autorității contractante"),
  countyAuthority: z.string().optional().describe("Județul autorității contractante"),
  supplier: z.string().optional().describe("Numele furnizorului"),
  localitySupplier: z.string().optional().describe("Localitatea furnizorului"),
  countySupplier: z.string().optional().describe("Județul furnizorului"),
  euFunds: z
    .boolean()
    .optional()
    .describe("Filtru pentru contracte finanțate din fonduri europene"),
});

const searchItemDirectSchema = z.object({
  date: z.string().describe("Data publicării sau atribuirii contractului"),
  name: z.string().describe("Denumirea contractului sau achiziției"),
  code: z
    .string()
    .describe(
      "Codul unic de identificare al contractului (ex: codul anunțului sau achiziției - CN, SCN, DA, etc.)",
    ),
  cpvCode: z.string().describe("Codul CPV principal asociat contractului"),
  cpvCodeAndName: z.string().describe("Codul CPV și denumirea completă asociată contractului"),
  value: z.string().describe("Valoarea contractului (RON)"),
  supplierId: z.string().describe("ID-ul furnizorului câștigător"),
  supplierName: z.string().describe("Numele furnizorului câștigător"),
  localitySupplier: z.string().describe("Localitatea furnizorului"),
  countySupplier: z.string().describe("Județul furnizorului"),
  contractingAuthorityId: z.string().describe("ID-ul autorității contractante"),
  contractingAuthorityName: z.string().describe("Numele autorității contractante"),
  localityAuthority: z.string().describe("Localitatea autorității contractante"),
  countyAuthority: z.string().describe("Județul autorității contractante"),
  state: z.string().describe("Starea contractului sau achiziției"),
  stateId: z.number().describe("ID numeric pentru starea contractului sau achiziției"),
  type: z.string().describe("Tipul contractului sau achiziției"),
  typeId: z.number().describe("ID numeric pentru tipul contractului sau achiziției"),
  euFunds: z.string().describe("Informații despre finanțarea din fonduri europene"),
});

const searchItemPublicSchema = searchItemDirectSchema.extend({
  procedureType: z.string(),
  procedureTypeId: z.string(),
  assigmentType: z.string(),
  assigmentTypeId: z.string(),
  supplierFiscalNumber: z.string(),
});

const searchItemOfflineSchema = searchItemDirectSchema;

const searchItemSchema = z.union([
  searchItemPublicSchema,
  searchItemDirectSchema,
  searchItemOfflineSchema,
]);

const outputSchema = z.object({
  took: z.number(),
  total: z.number(),
  items: z.array(
    z.object({
      id: z.string().describe("ID-ul unic al contractului"),
      index: z
        .string()
        .describe(
          "Indexul bazei de date (licitații publice, achiziții directe, achiziții offline)",
        ),
      fields: searchItemSchema,
    }),
  ),
});

export const searchContractsTool = createTool({
  id: "searchContractsTool",
  description: "Caută contracte publice în baza de date a SICAP",
  inputSchema,
  outputSchema,
  execute: async ({ context }) => {
    const {
      query,
      page,
      perPage,
      db,
      dateFrom,
      dateTo,
      valueFrom,
      valueTo,
      authority,
      cpv,
      localityAuthority,
      countyAuthority,
      supplier,
      localitySupplier,
      countySupplier,
      euFunds,
    } = context;
    const results = await searchContracts({
      query,
      page,
      perPage,
      filters: {
        db,
        dateFrom,
        dateTo,
        valueFrom,
        valueTo,
        authority,
        cpv,
        localityAuthority,
        countyAuthority,
        supplier,
        localitySupplier,
        countySupplier,
        euFunds,
      },
    });
    return results;
  },
});
