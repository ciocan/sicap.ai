import { Client } from "@elastic/elasticsearch";

const ES_URL = process.env.ES_URL || "http://localhost:9200";
const ES_API_KEY = process.env.ES_API_KEY as string;

export const esClient = new Client({
  auth: { apiKey: ES_API_KEY },
  node: ES_URL,
  tls: {
    rejectUnauthorized: false,
  },
});