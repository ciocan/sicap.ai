import { useMemo } from "react"
import { useRouter } from "next/router"
import namor from "namor"

import { Table } from "@components"
import { moneyRon } from "@utils"

const range = (len) => {
  const arr = []
  for (let i = 0; i < len; i++) {
    arr.push(i)
  }
  return arr
}

const newRow = () => {
  return {
    name: <a href="#">{namor.generate({ words: 4, numbers: 0 })}</a>,
    contracts: Math.floor(Math.random() * 1000 + 500),
    value: moneyRon(Math.floor(Math.random() * 100000 + 10000)),
  }
}

export default function makeData(...lens) {
  const makeDataLevel = (depth = 0) => {
    const len = lens[depth]
    return range(len).map(() => {
      return {
        ...newRow(),
        subRows: lens[depth + 1] ? makeDataLevel(depth + 1) : undefined,
      }
    })
  }

  return makeDataLevel()
}

export function Stats() {
  const router = useRouter()
  const [db, stat = "firme"] = router.query?.param || ["licitatii"]

  const columns = useMemo(
    () => [
      {
        Header: " ",
        accessor: (row, i) => i + 1,
      },
      {
        Header: " ",
        accessor: "name",
      },
      {
        Header: "Contracte",
        accessor: "contracts",
      },
      {
        Header: "Valoare",
        accessor: "value",
      },
    ],
    []
  )

  const data = useMemo(() => makeData(1000), [])

  return <Table columns={columns} data={data} />
}
