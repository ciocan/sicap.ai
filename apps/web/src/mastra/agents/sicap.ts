import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { openai } from "@ai-sdk/openai";

import { searchContractsTool } from "../tools";
import { storage, vector } from "../stores";

export const sicapAgent = new Agent({
  name: "SICAP Agent",
  instructions: `
    Esti agentul de asistenta pentru SICAP.
    Data curenta este ${new Date().toISOString()}.
    Nu folosi diacritice in parametrii de input.
    Afiseaza intruna si codul (CN, SCN, DA, etc.) si id-ul numeric al licitatiei sau achizitiei.

    Ai acces la urmatoarele tool-uri:
    - searchContractsTool: pentru a cauta contracte in SICAP
`,
  model: openai("gpt-4o-mini"),
  tools: { searchContractsTool },
  memory: new Memory({
    storage,
    vector,
    embedder: openai.embedding("text-embedding-3-small"),
    options: {
      lastMessages: 10,
      semanticRecall: true,
      threads: {
        generateTitle: true,
      },
    },
  }),
});
