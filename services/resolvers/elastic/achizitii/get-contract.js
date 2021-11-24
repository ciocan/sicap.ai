import elasticsearch from "elasticsearch"
import { pick } from "ramda"

import { ES_HOST, ES_INDEX_DIRECT } from "@utils/config"
import { getDurationInMilliseconds } from "@utils"

const client = new elasticsearch.Client({
  host: ES_HOST,
})

export async function getDirectContract({ id }) {
  const start = process.hrtime()

  const result = await client.search({
    index: ES_INDEX_DIRECT,
    body: {
      query: {
        match: {
          _id: id,
        },
      },
    },
  })

  const [contract] = result.hits.hits
  const ms = getDurationInMilliseconds(start)

  if (!contract) {
    return null
  }

  const data = {
    ms,
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
      contract._source.item,
    ),
    ...pick(
      [
        "directAcquisitionDescription",
        "sysAcquisitionContractType",
        "directAcquisitionItems",
      ],
      contract._source.publicDirectAcquisition,
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
        contract._source.supplier,
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
        contract._source.authority,
      ),
    },
  }

  return data
}
