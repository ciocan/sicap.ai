import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { openai } from "@ai-sdk/openai";
import { LangfuseClient } from "@langfuse/client";
import { ToolCallFilter } from "@mastra/memory/processors";

import { searchContractsTool } from "@/agent/tools/search-contracts";
import { searchAuthoritiesTool } from "@/agent/tools/search-authorities";
import { searchCompaniesTool } from "@/agent/tools/search-companies";

import { storage, vector } from "@/agent/stores";

const langfuse = new LangfuseClient();

const agentPrompt = await langfuse.prompt.get("sicap-agent");
const promptInstructions = agentPrompt.compile({ currentDate: new Date().toISOString() });

// console.log("promptInstructions", promptInstructions);

export const sicapAgent = new Agent({
  name: "SICAP Agent",
  instructions: promptInstructions,
  model: openai("gpt-5-mini"),
  tools: { searchContractsTool, searchAuthoritiesTool, searchCompaniesTool },
  defaultStreamOptions: ({ runtimeContext }) => {
    const userId = runtimeContext.get("userId") as string;
    const threadId = runtimeContext.get("threadId") as string;
    return {
      runtimeContext,
      telemetry: {
        isEnabled: true,
        metadata: {
          sessionId: threadId,
          userId,
        },
      },
    };
  },
  memory: new Memory({
    storage,
    vector,
    // processors: [new ToolCallFilter()],
    embedder: openai.embedding("text-embedding-3-small"),
    options: {
      lastMessages: 10,
      semanticRecall: {
        topK: 3,
        messageRange: 2,
        scope: "resource",
      },
    },
  }),
});
