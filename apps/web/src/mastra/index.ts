import { Mastra } from "@mastra/core/mastra";
import { createLogger } from "@mastra/core/logger";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { sicapAgent } from "./agents";

export const mastra = new Mastra({
  agents: { sicapAgent },
  storage: new LibSQLStore({
    url: ":memory:",
  }),
  logger: createLogger({
    name: "SICAP Agent",
    level: "info",
  }),
});
