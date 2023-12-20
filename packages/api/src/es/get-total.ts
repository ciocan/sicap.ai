import { ES_INDEX_DIRECT, ES_INDEX_PUBLIC, ES_INDEX_OFFLINE } from "./utils";
import { esClient } from "./config";

export async function getTotal() {
  const licitatii = await esClient.count({ index: ES_INDEX_PUBLIC });
  const achizitii = await esClient.count({ index: ES_INDEX_DIRECT });
  const offline = await esClient.count({ index: ES_INDEX_OFFLINE });

  return {
    licitatii: licitatii.count,
    achizitii: achizitii.count,
    offline: offline.count,
  };
}
