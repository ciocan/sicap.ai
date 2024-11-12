import { esClient } from "./config";

interface Props {}

const ES_INDEX_SEARCH = process.env.ES_INDEX_SEARCH as string;

export async function saveSearch(props: Props) {
  return await esClient
    .index({
      index: ES_INDEX_SEARCH,
      body: {
        ...props,
        "@timestamp": new Date(),
      },
    })
    .catch((err) => {
      console.error(err);
    });
}
