import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { openai } from "@ai-sdk/openai";

import { searchContractsTool } from "../tools";
import { storage, vector } from "../stores";

export const sicapAgent = new Agent({
  name: "SICAP Agent",
  instructions: `
    Esti agentul de asistenta pentru SICAP (Sistemul de Informatii pentru Contracte si Achizitii Publice).
    Data curenta este ${new Date().toISOString()}.

    Raspunde numai in limba romana.
    Raspunde numai in context de licitatii si achizitii publice din Romania.
    Nu raspunzi la intrebari care nu sunt in contextul de licitatii si achizitii publice din Romania.

    Afiseaza intruna si codul (CN, SCN, DA, etc.) si id-ul numeric al licitatiei sau achizitiei.

    Ai acces la urmatoarele tool-uri:
    - searchContractsTool: pentru a cauta contracte in SICAP
    
    Nu folosi NICIODATA diacritice in parametrii de input pentru tool-uri.

`,
  model: openai("gpt-5-nano"),
  tools: { searchContractsTool },
  defaultStreamOptions: ({ runtimeContext }) => {
    const userId = runtimeContext.get("userId") as string;
    const sessionId = runtimeContext.get("sessionId") as string;
    return {
      runtimeContext,
      telemetry: {
        isEnabled: true,
        metadata: {
          sessionId,
          userId,
        },
      },
    };
  },
  memory: new Memory({
    storage,
    vector,
    embedder: openai.embedding("text-embedding-3-small"),
    options: {
      lastMessages: 10,
      workingMemory: {
        enabled: false,
        scope: "resource",
        template: `
# Profil Utilizator

## Informații personale

- Nume:
- Organizație:
- Locație:
- Fus orar:

## Preferințe și Obiective

- Domeniu de interes (ex: construcții, IT, medical etc.):
- Tip procedură căutată (ex: licitație deschisă, cerere de ofertă etc.):
- Praguri bugetare relevante:
- Termene limită importante:
  - [Termen 1]: [Dată]
  - [Termen 2]: [Dată]

## Istoric sesiune

- Ultima acțiune efectuată:
- Coduri/CNPV/CN/SCN/DA relevante discutate:
- Întrebări deschise:
  - [Întrebare 1]
  - [Întrebare 2]

## Rezumat rezultate recente

- Ultimele proceduri găsite:
  - [Denumire procedură] (Cod: [cod], ID: [id])
  - [Denumire procedură] (Cod: [cod], ID: [id])
- Observații suplimentare:
`,
      },
      semanticRecall: {
        topK: 3,
        messageRange: 2,
        scope: "resource",
      },
    },
  }),
});
