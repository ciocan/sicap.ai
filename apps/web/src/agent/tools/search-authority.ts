import { createTool } from "@mastra/core";
import { z } from "zod";

import { searchAuthorities } from "@sicap/api";

const inputSchema = z.object({
  query: z.string().describe("Numele autorității contractante căutate"),
  city: z.string().optional().describe("Localitatea autorității contractante"),
  county: z.string().optional().describe("Județul autorității contractante"),
});

const authoritySchema = z.object({
  entityName: z.string().describe("Numele autorității contractante"),
  city: z.string().describe("Localitatea autorității contractante"),
  county: z.string().describe("Județul autorității contractante"),
  numericFiscalNumber: z.string().describe("Codul fiscal numeric al autorității"),
  entityId: z.string().describe("ID-ul unic al autorității contractante"),
});

const outputSchema = z.array(authoritySchema);

export const searchAuthoritiesTool = createTool({
  id: "searchAuthoritiesTool",
  description: "Caută autorități contractante în baza de date a SICAP",
  inputSchema,
  outputSchema,
  execute: async ({ context }) => {
    const { query, city, county } = context;
    const results = await searchAuthorities(query, city, county);
    return results;
  },
});
