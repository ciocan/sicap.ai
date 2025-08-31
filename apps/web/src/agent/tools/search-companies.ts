import { createTool } from "@mastra/core";
import { z } from "zod";

import { searchCompanies } from "@sicap/api";

const inputSchema = z.object({
  query: z.string().describe("Numele companiei căutate"),
  city: z.string().optional().describe("Localitatea companiei"),
  county: z.string().optional().describe("Județul companiei"),
});

const companySchema = z.object({
  entityId: z.number().describe("ID-ul unic al companiei"),
  numericFiscalNumber: z.string().describe("Codul fiscal numeric"),
  fiscalNumber: z.string().describe("Codul fiscal"),
  entityName: z.string().describe("Numele companiei"),
  city: z.string().describe("Localitatea companiei"),
  county: z.string().describe("Județul companiei"),
  country: z.string().describe("Țara"),
});

const outputSchema = z.array(companySchema);

export const searchCompaniesTool = createTool({
  id: "searchCompaniesTool",
  description: "Caută companii în baza de date a SICAP",
  inputSchema,
  outputSchema,
  execute: async ({ context }) => {
    const { query, city, county } = context;
    const results = await searchCompanies(query, city, county);
    return results;
  },
});
