import { esClient } from "./config";

interface Props {}

export async function saveSearch(props: Props) {
  return await esClient
    .index({
      index: "cautari",
      body: {
        ...props,
        "@timestamp": new Date(),
      },
    })
    .catch((err) => {
      console.error(err);
    });
}
