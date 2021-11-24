import elasticsearch from "elasticsearch"
import { pick } from "ramda"

import { RESULTS_PER_PAGE } from "@utils/constants"
import { ES_HOST, ES_INDEX, ES_INDEX_DIRECT } from "@utils/config"
import { getDurationInMilliseconds } from "@utils"

const client = new elasticsearch.Client({
  host: ES_HOST,
})

import { noticeProps, noticeDetailsProps, caNoticeEdit_New } from "./_common"

export async function getBookmarkedContracts(args) {
  if (args.db === "licitatii") return await getBookmarkedContractsL(args)
  if (args.db === "achizitii") return await getBookmarkedContractsA(args)
  return null
}

async function getBookmarkedContractsL({ bookmarks, page = 1 }) {
  const start = process.hrtime()

  if (bookmarks && bookmarks.length === 0) return null

  const should = bookmarks.map((contractId) => ({
    match_phrase: {
      "item.caNoticeId": contractId,
    },
  }))

  const result = await client.search({
    index: ES_INDEX,
    body: {
      query: {
        bool: {
          filter: [
            {
              match_all: {},
            },
            {
              bool: {
                should,
              },
            },
          ],
        },
      },
      sort: [
        {
          "item.noticeStateDate": {
            order: "desc",
            unmapped_type: "boolean",
          },
        },
      ],
      from: (parseInt(page) - 1) * RESULTS_PER_PAGE,
    },
  })

  const data = {
    ms: getDurationInMilliseconds(start),
    hits: result.hits.total.value,
    list: result.hits.hits.map((res) => {
      return {
        ...pick(noticeProps, res._source.item),
        ...{
          ...pick(noticeDetailsProps, res._source.publicNotice),
          ...pick(
            caNoticeEdit_New,
            res._source.publicNotice.caNoticeEdit_New?.section2_New
              ?.section2_1_New || {},
          ),
          ...pick(["contractDate"], res._source.noticeContracts),
          winner: {
            ...pick(
              ["name", "fiscalNumber", "fiscalNumberInt", "entityId"],
              res._source.noticeContracts?.items[0]?.winner || {},
            ),
          },
          winners: res._source.noticeContracts?.items[0]?.winners?.map(
            (winner) => ({
              ...pick(
                ["entityId", "name", "fiscalNumber", "fiscalNumberInt"],
                winner || {},
              ),
            }),
          ),
        },
      }
    }),
  }

  return data
}

async function getBookmarkedContractsA({ bookmarks, page = 1 }) {
  const start = process.hrtime()

  if (bookmarks && bookmarks.length === 0) return null

  const should = bookmarks.map((contractId) => ({
    match_phrase: {
      "item.directAcquisitionId": contractId,
    },
  }))

  const result = await client.search({
    index: ES_INDEX_DIRECT,
    body: {
      query: {
        bool: {
          filter: [
            {
              match_all: {},
            },
            {
              bool: {
                should,
              },
            },
          ],
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
      from: (parseInt(page) - 1) * RESULTS_PER_PAGE,
    },
  })

  const data = {
    ms: getDurationInMilliseconds(start),
    hits: result.hits.total.value,
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
          res._source.item,
        ),
        ...pick(
          ["sysAcquisitionContractType"],
          res._source.publicDirectAcquisition,
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
            res._source.supplier,
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
            res._source.authority,
          ),
        },
      }
    }),
  }

  return data
}
