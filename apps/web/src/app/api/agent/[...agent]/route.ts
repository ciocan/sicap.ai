import { handle } from "hono/vercel";
import { evaluate } from "@mastra/core/eval";
import { AvailableHooks, registerHook } from "@mastra/core/hooks";
import { TABLE_EVALS } from "@mastra/core/storage";
import { checkEvalStorageFields } from "@mastra/core/utils";
import type { Tool } from "@mastra/core";

import { mastra } from "@/mastra";
import { searchContractsTool } from "@/mastra/tools";
import { createHonoServer } from "@/lib/agent/server";

export const runtime = "nodejs";

registerHook(
  AvailableHooks.ON_GENERATION,
  ({ input, output, metric, runId, agentName, instructions }) => {
    evaluate({
      agentName,
      input,
      metric,
      output,
      runId,
      globalRunId: runId,
      instructions,
    });
  },
);

registerHook(AvailableHooks.ON_EVALUATION, async (traceObject) => {
  const storage = mastra.getStorage();
  if (storage) {
    const logger = mastra?.getLogger();
    const areFieldsValid = checkEvalStorageFields(traceObject, logger);
    if (!areFieldsValid) {
      return;
    }

    await storage.insert({
      tableName: TABLE_EVALS,
      record: {
        input: traceObject.input,
        output: traceObject.output,
        result: JSON.stringify(traceObject.result || {}),
        agent_name: traceObject.agentName,
        metric_name: traceObject.metricName,
        instructions: traceObject.instructions,
        test_info: null,
        global_run_id: traceObject.globalRunId,
        run_id: traceObject.runId,
        created_at: new Date().toISOString(),
      },
    });
  }
});

const app = await createHonoServer(mastra, {
  // tools: getToolExports([searchContractsTool]),
  tools: {
    searchContractsTool: searchContractsTool as unknown as Tool,
  },
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
export const HEAD = handle(app);

app.get("/hello", (c) => {
  return c.json({
    message: "Hello from Hono!",
  });
});
