import elasticsearch from "elasticsearch"

import { ES_HOST } from "@utils/config"

const client = new elasticsearch.Client({
  host: ES_HOST,
})

const dbMap = {
  licitatii: {
    index: "firme-licitatii",
  },
  achizitii: {
    index: "firme",
  },
}

const THRESHOLD = 70
const PAGE_SIZE = 20

export async function getCapusaList({ db, page, opt }) {
  console.log("getCapusaList: ", opt)

  const result = await client.search({
    index: [dbMap[db].index],
    body: {
      size: PAGE_SIZE,
      from: (parseInt(page) - 1) * PAGE_SIZE,
      sort: [
        {
          _score: {
            order: "desc",
          },
        },
        {
          "stats.totalRatio": {
            order: "desc",
            unmapped_type: "boolean",
          },
        },
      ],
      aggs: {
        totalValue: {
          sum: {
            field: "stats.value",
          },
        },
      },
      query: {
        bool: {
          filter: [
            {
              match_all: {},
            },
            {
              exists: {
                field: "stats.totalRatio",
              },
            },
            {
              range: {
                "stats.ratio.2019": {
                  gte: THRESHOLD,
                  lt: 300,
                },
              },
            },
            {
              range: {
                "stats.ratio.2018": {
                  gte: THRESHOLD,
                  lt: 300,
                },
              },
            },
          ],
        },
      },
    },
  })

  const list = result.hits.hits.map((hit) => {
    const { data, stats } = hit._source

    const employees = []
    const statsMap = new Map()

    Object.entries(stats.fiscal).forEach((e) => {
      const year = Number(e[0])
      const value = e[1].r
      const employee = e[1].e

      if (statsMap.has(year)) {
        statsMap.set(year, {
          fiscal: value,
          ...statsMap.get(year),
        })
      } else {
        statsMap.set(year, { fiscal: value })
      }

      if (employee) employees.push(employee)
    })

    stats.date.forEach((e) => {
      if (statsMap.has(e.year)) {
        statsMap.set(e.year, {
          sicap: e.value,
          ...statsMap.get(e.year),
        })
      } else {
        statsMap.set(e.year, { sicap: e.value })
      }
    })

    statsMap.delete(2020)

    const statsArray = Array.from(statsMap).sort((a, b) => a[0] - b[0])

    return {
      entityId: data.entityId,
      fiscalNumber: data.numericFiscalNumber,
      entityName: data.entityName,
      city: data?.address.city || data.city,
      county: data?.address?.county?.text || data.county,
      stats: {
        contracts: stats.contracts,
        employees:
          Math.round(employees.reduce((a, b) => a + b, 0) / employees.length) ||
          0,
        value: stats.value,
        data: [
          {
            label: "Date financiare",
            data: statsArray.map((e) => ({
              primary: e[0],
              secondary: e[1].fiscal || 0.01,
            })),
          },
          {
            label: "Valoare SICAP",
            data: statsArray.map((e) => ({
              primary: e[0],
              secondary: e[1].sicap || 0.01,
            })),
          },
        ],
      },
    }
  })

  return {
    total: result.hits.total.value,
    value: result.aggregations.totalValue.value,
    list,
  }
}
