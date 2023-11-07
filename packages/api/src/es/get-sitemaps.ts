import { ES_INDEX_DIRECT, ES_INDEX_PUBLIC } from "./utils";
import { esClient } from "./config";

interface SearchObject {
  _id: string;
  _source: {
    item: {
      publicationDate: string;
      noticeStateDate: string;
    };
  };
}

export async function getSitemapAchizitii(size = 100) {
  const result = (await esClient.search({
    index: ES_INDEX_DIRECT,
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
      size,
    },
  })) as { hits: { hits: SearchObject[] } };

  return result.hits.hits.map((res) => ({
    id: res._id,
    date: res._source.item.publicationDate,
  }));
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

export async function getSitemapLicitatii(size = 100) {
  const result = (await esClient.search({
    index: ES_INDEX_PUBLIC,
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
      size,
    },
  })) as { hits: { hits: SearchObject[] } };

  return result.hits.hits.map((res) => ({
    id: res._id,
    date: res._source.item.noticeStateDate,
  }));
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
