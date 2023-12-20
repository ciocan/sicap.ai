import { SearchRequest } from "@elastic/elasticsearch/lib/api/types";

import { ES_INDEX_DIRECT, ES_INDEX_OFFLINE, ES_INDEX_PUBLIC } from "./utils";
import { esClient } from "./config";

interface SearchItem {
  item: {
    publicationDate: string;
    noticeStateDate: string;
  };
}

async function* scrollSearch<T>(params: SearchRequest, size: number) {
  let response = await esClient.search<T>(params);
  let total = 0;

  while (true) {
    const sourceHits = response.hits.hits;
    total += sourceHits.length;

    if (sourceHits.length === 0) {
      break;
    }

    for (const hit of sourceHits) {
      yield hit;
    }

    if (!response._scroll_id) {
      break;
    }

    if (total >= size) {
      break;
    }

    response = await esClient.scroll({
      scroll_id: response._scroll_id,
      scroll: params.scroll,
    });
  }
}

export async function getSitemapAchizitii(size = 1000) {
  const scrollDuration = "1m";
  const allResults = [];

  const params = {
    index: ES_INDEX_DIRECT,
    scroll: scrollDuration,
    body: {
      query: {
        match_all: {},
      },
      sort: [
        {
          "item.publicationDate": {
            order: "desc",
            unmapped_type: "boolean",
          },
        },
      ],
      _source: ["_id", "item.publicationDate"],
      size: 10_000,
    },
  };

  for await (const hit of scrollSearch<SearchItem>(params, size)) {
    allResults.push({
      id: hit._id,
      date: hit._source?.item.publicationDate as string,
    });
  }

  return allResults;
}

export async function getSitemapAchizitiiFirme(size = 1000) {
  const scrollDuration = "1m";
  const allResults = [];

  const params = {
    index: "firme",
    scroll: scrollDuration,
    body: {
      query: {
        match_all: {},
      },
      _source: ["_id"],
      size: 10_000,
    },
  };

  for await (const hit of scrollSearch(params, size)) {
    allResults.push({
      id: hit._id,
      date: new Date().toISOString(),
    });
  }

  return allResults;
}

export async function getSitemapAchizitiiAutoritati(size = 1000) {
  const scrollDuration = "1m";
  const allResults = [];

  const params = {
    index: "autoritati",
    scroll: scrollDuration,
    body: {
      query: {
        match_all: {},
      },
      _source: ["_id"],
      size: 10_000,
    },
  };

  for await (const hit of scrollSearch(params, size)) {
    allResults.push({
      id: hit._id,
      date: new Date().toISOString(),
    });
  }

  return allResults;
}

export async function getSitemapLicitatii(size = 1000) {
  const scrollDuration = "1m";
  const allResults = [];

  const params = {
    index: ES_INDEX_PUBLIC,
    scroll: scrollDuration,
    body: {
      query: {
        match_all: {},
      },
      sort: [
        {
          "item.noticeStateDate": {
            order: "desc",
            unmapped_type: "boolean",
          },
        },
      ],
      _source: ["_id", "item.noticeStateDate"],
      size: 10_000,
    },
  };

  for await (const hit of scrollSearch<SearchItem>(params, size)) {
    allResults.push({
      id: hit._id,
      date: hit._source?.item.noticeStateDate as string,
    });
  }

  return allResults;
}

interface AggsResponse {
  aggregations: {
    cpv: {
      buckets: Array<{
        key: string;
        doc_count: number;
      }>;
    };
  };
}

export async function getSitemapAchizitiiCpv(size = 100) {
  try {
    const result = (await esClient.search({
      index: ES_INDEX_DIRECT,
      body: {
        size: 0,
        aggs: {
          cpv: {
            terms: {
              field: "publicDirectAcquisition.cpvCode.localeKey.keyword",
              size,
            },
          },
        },
      },
    })) as AggsResponse;

    return result.aggregations.cpv.buckets.map(({ key }) => ({
      id: key,
      date: new Date().toISOString(),
    }));
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getSitemapLicitatiiCpv(size = 100) {
  try {
    const result = (await esClient.search({
      index: ES_INDEX_PUBLIC,
      body: {
        size: 0,
        aggs: {
          cpv: {
            terms: {
              field: "item.cpvCode.keyword",
              size,
            },
          },
        },
      },
    })) as AggsResponse;

    return result.aggregations.cpv.buckets.map(({ key }) => ({
      id: key,
      date: new Date().toISOString(),
    }));
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getSitemapAchizitiiOffline(size = 1000) {
  const scrollDuration = "1m";
  const allResults = [];

  const params = {
    index: ES_INDEX_OFFLINE,
    scroll: scrollDuration,
    body: {
      query: {
        match_all: {},
      },
      sort: [
        {
          "item.publicationDate": {
            order: "desc",
            unmapped_type: "boolean",
          },
        },
      ],
      _source: ["_id", "item.publicationDate"],
      size: 10_000,
    },
  };

  for await (const hit of scrollSearch<SearchItem>(params, size)) {
    allResults.push({
      id: hit._id,
      date: hit._source?.item.publicationDate as string,
    });
  }

  return allResults;
}
