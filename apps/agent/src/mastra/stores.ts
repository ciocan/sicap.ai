import { LibSQLStore, LibSQLVector } from "@mastra/libsql";

// import { env } from "../lib/env";

export const storage = new LibSQLStore({
  url: process.env.AGENT_DB!,
  authToken: process.env.AGENT_DB_AUTH_TOKEN,
});

export const vector = new LibSQLVector({
  connectionUrl: process.env.AGENT_DB!,
  authToken: process.env.AGENT_DB_AUTH_TOKEN,
});

export const VECTOR_STORE_NAME = "sicapVectorStore";
