import esb from "elastic-builder";

import { esClient } from "../config";

interface Company {
  entityId: number;
  numericFiscalNumber: string;
  fiscalNumber: string;
  entityName: string;
  address: string;
  city: string;
  county: string;
  country: string;
}

export async function searchCompanies(
  query: string,
  city?: string,
  county?: string,
): Promise<Company[]> {
  const mustQueries: esb.Query[] = [esb.matchQuery("data.entityName", query)];

  if (city) {
    mustQueries.push(esb.matchQuery("data.city", city));
  }

  if (county) {
    mustQueries.push(esb.matchQuery("data.county", county));
  }

  const searchQuery = esb
    .requestBodySearch()
    .query(esb.boolQuery().must(mustQueries))
    .size(5)
    .source([
      "data.entityId",
      "data.numericFiscalNumber",
      "data.fiscalNumber",
      "data.entityName",
      "data.city",
      "data.county",
      "data.country",
    ]);

  const response = await esClient.search<{ data: Company }>({
    index: "firme",
    body: searchQuery.toJSON(),
  });

  return response.hits.hits.map((hit) => hit._source?.data).filter((hit) => hit !== undefined);
}
