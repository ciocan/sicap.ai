import { esClient } from "../config";
import {
  ES_INDEX_DIRECT,
  ES_INDEX_OFFLINE,
  ES_INDEX_PUBLIC,
  type Fields,
  fieldsAchizitii,
  fieldsAchizitiiOffline,
  filedsLicitatii,
  transformItem,
} from "../utils";

export async function searchAuthorityAquisitions(
  fiscalCode: string,
  pitId: string,
  searchAfter?: string | null,
) {
  const results = await esClient.search({
    body: {
      track_total_hits: false,
      query: {
        match: {
          "authority.fiscalNumber": fiscalCode,
        },
      },
      pit: {
        id: pitId,
        keep_alive: "5m",
      },
      ...(searchAfter && { search_after: JSON.parse(searchAfter) }),
    },
    size: 20,
    // Sorting should be by _shard_doc or at least include _shard_doc for performance reasons
    sort: [{ _shard_doc: "desc" }],
    fields: [...fieldsAchizitii],
  });

  return results?.hits?.hits?.map((hit) => ({
    id: hit._id,
    index: hit._index,
    ...transformItem(ES_INDEX_DIRECT, hit.fields as Fields, hit.highlight as Fields),
    sort: hit.sort,
  }));
}

export async function searchAuthorityOffline(
  fiscalCode: string,
  pitId: string,
  searchAfter: string | null,
) {
  const results = await esClient.search({
    body: {
      track_total_hits: false,
      query: {
        match: {
          "authority.fiscalNumber": fiscalCode,
        },
      },
      pit: {
        id: pitId,
        keep_alive: "5m",
      },
      ...(searchAfter && { search_after: JSON.parse(searchAfter) }),
    },
    size: 20,
    // Sorting should be by _shard_doc or at least include _shard_doc for performance reasons
    sort: [{ _shard_doc: "desc" }],
    fields: [...fieldsAchizitiiOffline],
  });

  return results?.hits?.hits?.map((hit) => ({
    id: hit._id,
    index: hit._index,
    ...transformItem(ES_INDEX_OFFLINE, hit.fields as Fields, hit.highlight as Fields),
    sort: hit.sort,
  }));
}

export async function searchAuthorityLicitatii(
  fiscalCode: string,
  pitId: string,
  searchAfter: string | null,
) {
  const results = await esClient.search({
    body: {
      track_total_hits: false,
      query: {
        match: {
          "item.nationalId": fiscalCode,
        },
      },
      pit: {
        id: pitId,
        keep_alive: "5m",
      },
      ...(searchAfter && { search_after: JSON.parse(searchAfter) }),
      fields: [...filedsLicitatii],
    },
    size: 20,
    // Sorting should be by _shard_doc or at least include _shard_doc for performance reasons
    sort: [{ _shard_doc: "desc" }],
  });

  return results?.hits?.hits?.map((hit) => ({
    id: hit._id,
    index: hit._index,
    ...transformItem(ES_INDEX_PUBLIC, hit.fields as Fields, hit.highlight as Fields),
    sort: hit.sort,
  }));
}
