import esb from "elastic-builder";

import { esClient } from "../config";

interface ContractingAuthority {
  entityName: string;
  city: string;
  county: string;
  numericFiscalNumber: string;
  entityId: string;
}

export async function searchAuthorities(
  query: string,
  city?: string,
  county?: string,
): Promise<ContractingAuthority[]> {
  const mustQueries: esb.Query[] = [esb.wildcardQuery("data.entityName", `*${query}*`)];

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
      "data.entityName",
      "data.city",
      "data.county",
      "data.numericFiscalNumber",
      "data.entityId",
    ]);

  const response = await esClient.search<{ data: ContractingAuthority }>({
    index: "autoritati",
    body: searchQuery.toJSON(),
  });

  return response.hits.hits.map((hit) => hit._source?.data).filter((hit) => hit !== undefined);
}
