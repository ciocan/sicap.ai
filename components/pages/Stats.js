import { useMemo } from "react"
import { useRouter } from "next/router"
import { useQuery } from "@apollo/react-hooks"
import { Skeleton } from "@chakra-ui/core"

import { Table } from "@components"
import { moneyRon } from "@utils"

import { STATS } from "@services/queries"

export function Stats() {
  const router = useRouter()
  const [db, stat = "firme", start, end] = router.query?.param || ["licitatii"]

  const { data: statData, loading } = useQuery(STATS, {
    variables: { db, stat, start: Number(start), end: Number(end) },
  })

  const columns = useMemo(
    () => [
      {
        Header: " ",
        accessor: (row, i) => i + 1,
      },
      {
        Header: " ",
        accessor: "key",
      },
      {
        Header: "Contracte",
        accessor: "count",
      },
      {
        Header: "Valoare",
        accessor: "value",
      },
    ],
    []
  )

  return (
    <Skeleton isLoaded={!loading} height="400px">
      <Table
        columns={columns}
        data={
          statData?.getEntityList?.map(({ key, count, value }) => ({
            key,
            count,
            value: moneyRon(value),
          })) || []
        }
      />
    </Skeleton>
  )
}
