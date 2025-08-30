import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { openai } from "@ai-sdk/openai";
import { LangfuseClient } from "@langfuse/client";

import { searchContractsTool } from "@/agent/tools";
import { storage, vector } from "@/agent/stores";

const langfuse = new LangfuseClient();

const agentPrompt = await langfuse.prompt.get("sicap-agent");
const promptInstructions = agentPrompt.compile({ currentDate: new Date().toISOString() });

export const sicapAgent = new Agent({
  name: "SICAP Agent",
  instructions: promptInstructions,
  model: openai("gpt-5-mini"),
  tools: { searchContractsTool },
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
