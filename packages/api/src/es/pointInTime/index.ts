import { esClient } from "../config";
import type { ES_INDICES } from "../utils";

export async function createPointInTime(index: (typeof ES_INDICES)[number]) {
  return await esClient.openPointInTime({
    index,
    keep_alive: "5m",
  });
}
