import { SearchTotalHits } from "@elastic/elasticsearch/lib/api/types";

import { ES_INDEX_DIRECT, ES_INDEX_PUBLIC, esClient } from "./config";
import { transformItem } from "./utils";
import { IndexName, SearchProps } from "./types";

export async function searchContracts({ query, page = 1, perPage = 20 }: SearchProps) {
  const result = await esClient.search({
    index: [ES_INDEX_PUBLIC, ES_INDEX_DIRECT],
    // index: [ES_INDEX_DIRECT],
    // index: [ES_INDEX_PUBLIC],
    body: {
      query: {
        multi_match: {
          query,
          type: "phrase",
          lenient: true,
        },
      },
      sort: [
        {
          "item.publicationDate": {
            order: "desc",
            unmapped_type: "boolean",
          },
        },
        {
          "item.noticeStateDate": {
            order: "desc",
            unmapped_type: "boolean",
          },
        },
      ],
      // highlight: {
      //   pre_tags: ["<mark>"],
      //   post_tags: ["</mark>"],
      //   fields: {
      //     "*": {},
      //   },
      // },
      from: (page - 1) * perPage,
      size: perPage,
    },
    fields: [
      // achizitii directe
      "item.directAcquisitionId",
      "item.directAcquisitionName",
      "item.sysDirectAcquisitionState.*",
      "item.uniqueIdentificationCode",
      "item.cpvCode",
      "item.publicationDate",
      "item.closingValue",
      "item.supplier",
      "item.contractingAuthority",
      "publicDirectAcquisition.cpvCode.*",
      "publicDirectAcquisition.supplierId",
      "publicDirectAcquisition.contractingAuthorityID",
      "publicDirectAcquisition.sysAcquisitionContractType.*",
      // licitatii publice
      "item.caNoticeId",
      "item.noticeNo",
      "item.contractingAuthorityNameAndFN",
      "item.contractTitle",
      "item.sysAcquisitionContractType.*",
      "item.sysProcedureType.*",
      "item.sysContractAssigmentType.*",
      "item.sysNoticeState.*",
      "item.sysProcedureState.*",
      "item.cpvCodeAndName",
      "item.noticeStateDate",
      "publicNotice.entityId",
      "noticeContracts.items.winner.name",
      "noticeContracts.items.winner.fiscalNumber",
      "noticeContracts.items.winner.fiscalNumberInt",
      "noticeContracts.items.winner.entityId",
      "noticeContracts.items.contractValue",
    ],
    _source: false,
  });

  // console.log(result.hits.hits[18]);

  const total = result.hits.total as SearchTotalHits;

  return {
    took: result.took,
    total: total.value,
    items: result?.hits.hits.map((hit) => ({
      id: hit._id,
      index: hit._index as IndexName,
      fields: transformItem(hit._index, hit.fields as Record<string, (string | number)[]>),
    })),
  };
}
