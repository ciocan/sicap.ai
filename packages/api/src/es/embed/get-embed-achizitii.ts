import type { SearchTotalHits } from "@elastic/elasticsearch/lib/api/types";

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
import type { IndexName } from "../types";

const EMBED_RESULTS_LIMIT = 10;

interface EmbedArgs {
  fiscalNumber: string;
}

interface AuthorityInfo {
  entityName: string;
  fiscalNumber: string;
  city: string;
  county: string;
  entityId?: number;
}

export async function getEmbedAchizitii({ fiscalNumber }: EmbedArgs) {
  if (!fiscalNumber) {
    throw new Error("CUI/CIF este obligatoriu");
  }

  // Query all three indices for the given fiscal number
  const searchParams = {
    index: [ES_INDEX_DIRECT, ES_INDEX_OFFLINE, ES_INDEX_PUBLIC],
    body: {
      query: {
        bool: {
          should: [
            // Achizitii directe - by authority fiscal number
            {
              bool: {
                must: [
                  { term: { _index: ES_INDEX_DIRECT } },
                  { match: { "authority.fiscalNumber": fiscalNumber } },
                ],
              },
            },
            // Achizitii offline - by authority fiscal number
            {
              bool: {
                must: [
                  { term: { _index: ES_INDEX_OFFLINE } },
                  { match: { "authority.fiscalNumber": fiscalNumber } },
                ],
              },
            },
            // Licitatii publice - by nationalId (fiscal number)
            {
              bool: {
                must: [
                  { term: { _index: ES_INDEX_PUBLIC } },
                  { match: { "item.nationalId": fiscalNumber } },
                ],
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
      sort: [
        {
          _script: {
            type: "number",
            script: {
              source: `
                if (doc.containsKey('item.noticeStateDate') && doc['item.noticeStateDate'].size() > 0) {
                  return doc['item.noticeStateDate'].value.getMillis();
                } else if (doc.containsKey('item.publicationDate') && doc['item.publicationDate'].size() > 0) {
                  return doc['item.publicationDate'].value.getMillis();
                } else {
                  return 0;
                }
              `,
              lang: "painless",
            },
            order: "desc",
          },
        },
      ],
      size: EMBED_RESULTS_LIMIT,
    },
    fields: [...fieldsAchizitii, ...filedsLicitatii, ...fieldsAchizitiiOffline],
    _source: true,
  };

  const result = await esClient.search(searchParams);
  const total = result.hits.total as SearchTotalHits;
  const hits = result.hits.hits;

  if (hits.length === 0) {
    throw new Error(`Nu s-au găsit rezultate pentru CUI: ${fiscalNumber}`);
  }

  // Extract authority info from the first result
  let authority: AuthorityInfo | null = null;

  for (const hit of hits) {
    const source = hit._source as Record<string, unknown>;

    if (hit._index === ES_INDEX_DIRECT || hit._index === ES_INDEX_OFFLINE) {
      const authorityData = source.authority as Record<string, unknown> | undefined;
      if (authorityData) {
        authority = {
          entityName: authorityData.entityName as string,
          fiscalNumber: authorityData.fiscalNumber as string,
          city: authorityData.city as string,
          county: authorityData.county as string,
          entityId: authorityData.entityId as number,
        };
        break;
      }
    } else if (hit._index === ES_INDEX_PUBLIC) {
      const item = source.item as Record<string, unknown> | undefined;
      const publicNotice = source.publicNotice as Record<string, unknown> | undefined;
      if (item) {
        const contractingAuthorityNameAndFN = item.contractingAuthorityNameAndFN as string;
        authority = {
          entityName:
            contractingAuthorityNameAndFN?.split(" - ")?.[1] || contractingAuthorityNameAndFN || "",
          fiscalNumber: fiscalNumber,
          city: "",
          county: "",
          entityId: publicNotice?.entityId as number,
        };
        break;
      }
    }
  }

  return {
    total: total.value,
    authority,
    items: hits.map((hit) => ({
      id: hit._id as string,
      index: hit._index as IndexName,
      fields: transformItem(hit._index, hit.fields as Fields, {} as Fields),
    })),
  };
}
