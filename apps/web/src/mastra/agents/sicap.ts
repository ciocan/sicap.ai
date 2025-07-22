import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { openai } from "@ai-sdk/openai";

import { searchContractsTool } from "@/mastra/tools";

export const sicapAgent = new Agent({
  name: "SICAP Agent",
  instructions: `
    Esti agentul de asistenta pentru SICAP.
`,
  model: openai("gpt-4o-mini"),
  tools: { searchContractsTool },
  // memory: new Memory({
  //   storage: new LibSQLStore({
  //     url: 'file:../mastra.db',
  //   }),
  //   options: {
  //     lastMessages: 10,
  //     semanticRecall: false,
  //     threads: {
  //       generateTitle: true,
  //     },
  //   },
  // }),
});
