import { ES_INDEX_DIRECT, ES_INDEX_PUBLIC, esClient } from "./config";

export async function getTotal() {
  const licitatii = await esClient.count({ index: ES_INDEX_PUBLIC });
  const achizitii = await esClient.count({ index: ES_INDEX_DIRECT });

  return {
    licitatii: new Intl.NumberFormat().format(licitatii.count),
    achizitii: new Intl.NumberFormat().format(achizitii.count),
  };
}
