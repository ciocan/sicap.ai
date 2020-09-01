import elasticsearch from "elasticsearch"
import { pick } from "ramda"

import { RESULTS_PER_PAGE } from "@utils/constants"
import { ES_HOST, ES_INDEX_DIRECT } from "@utils/config"
import { getDurationInMilliseconds } from "@utils"

const client = new elasticsearch.Client({
  host: ES_HOST,
})

export async function getDirectContracts({ page = 1, query }) {
  const start = process.hrtime()

  const result = await client.search({
    index: ES_INDEX_DIRECT,
    body: {
      query: {
        multi_match: {
          query,
          type: "best_fields",
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
      ],
      highlight: {
        pre_tags: ["<mark>"],
        post_tags: ["</mark>"],
        fields: {
          "*": {},
        },
      },
      from: (parseInt(page) - 1) * RESULTS_PER_PAGE,
    },
  })

  const data = {
    ms: getDurationInMilliseconds(start),
    hits: result.hits.total.value,
    list: result.hits.hits.map((res) => {
      res._source.item.directAcquisitionName =
        (res.highlight["item.directAcquisitionName"] &&
          res.highlight["item.directAcquisitionName"][0]) ||
        res._source.item.directAcquisitionName

      return {
        ...pick(
          [
            "directAcquisitionId",
            "directAcquisitionName",
            "sysDirectAcquisitionState",
            "uniqueIdentificationCode",
            "cpvCode",
            "publicationDate",
            "closingValue",
          ],
          res._source.item
        ),
        ...pick(
          [
            "directAcquisitionDescription",
            "sysAcquisitionContractType",
            "directAcquisitionItems",
          ],
          res._source.publicDirectAcquisition
        ),
        supplier: {
          ...pick(
            [
              "entityId",
              "numericFiscalNumber",
              "entityName",
              "city",
              "county",
              "country",
              "postalCode",
            ],
            res._source.supplier
          ),
        },
        contractingAuthority: {
          ...pick(
            [
              "entityId",
              "numericFiscalNumber",
              "entityName",
              "city",
              "county",
              "country",
              "postalCode",
            ],
            res._source.authority
          ),
        },
      }
    }),
  }

  return data
}
