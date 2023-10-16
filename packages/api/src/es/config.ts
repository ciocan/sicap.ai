import { Client } from "@elastic/elasticsearch";

export const esClient = new Client({
  node: process.env.ES_URL,
});

export const ES_INDEX_PUBLIC = "licitatii-publice";
export const ES_INDEX_DIRECT = "achizitii-directe";
