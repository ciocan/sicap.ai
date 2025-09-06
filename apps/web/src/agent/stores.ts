import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { createClient } from "@libsql/client";

import { env } from "@/lib/env";

export const storage = new LibSQLStore({
  url: env.AGENT_DB,
  authToken: env.AGENT_DB_AUTH_TOKEN,
});

export const vector = new LibSQLVector({
  connectionUrl: env.AGENT_DB,
  authToken: env.AGENT_DB_AUTH_TOKEN,
});

export const VECTOR_STORE_NAME = "sicapVectorStore";

export const agentDBClient = createClient({
  url: env.AGENT_DB,
  authToken: env.AGENT_DB_AUTH_TOKEN,
});
