import elasticsearch from "elasticsearch"
import { pick } from "ramda"

import { RESULTS_PER_PAGE } from "@utils/constants"
import { ES_HOST, ES_INDEX_DIRECT } from "@utils/config"
import { getDurationInMilliseconds } from "@utils"

const client = new elasticsearch.Client({
  host: ES_HOST,
})

const mapBucket = (b) => ({
  key: b.key_as_string,
  count: b.doc_count,
  value: b.sales.value,
})

export async function getDirectCompany(args) {
  const { authority, company, page = 1 } = args
  const start = process.hrtime()

  if (!authority && !company) return null

  const query = company
    ? {
        match: { "supplier.entityId": Number(company) },
      }
    : {
        match: { "authority.entityId": Number(authority) },
      }

  const result = await client.search({
    index: ES_INDEX_DIRECT,
    body: {
      query,
      sort: [
        {
          "item.publicationDate": {
            order: "desc",
            unmapped_type: "boolean",
          },
        },
      ],
      aggs: {
        months: {
          date_histogram: {
            field: "item.publicationDate",
            calendar_interval: "month",
          },
          aggs: {
            sales: {
              sum: {
                field: "item.closingValue",
              },
            },
          },
        },
        years: {
          date_histogram: {
            field: "item.publicationDate",
            calendar_interval: "year",
          },
          aggs: {
            sales: {
              sum: {
                field: "item.closingValue",
              },
            },
          },
        },
      },
      from: (parseInt(page) - 1) * RESULTS_PER_PAGE,
    },
  })

  const ms = getDurationInMilliseconds(start)
  const size = Buffer.byteLength(JSON.stringify(result))
  const [firstContract] = result.hits.hits

  if (!firstContract)
    return {
      ms,
      size,
      hits: result.hits.total.value,
    }

  return {
    ms,
    size,
    hits: result.hits.total.value,
    supplier: firstContract._source.supplier,
    contractingAuthority: firstContract._source.authority,
    list: result.hits.hits.map((res) => {
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
    stats: {
      years: result.aggregations.years.buckets.map(mapBucket),
      months: result.aggregations.months.buckets.map(mapBucket),
    },
  }
}
