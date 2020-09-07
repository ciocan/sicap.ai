import { useMemo } from "react"
import { useRouter } from "next/router"
import { useQuery } from "@apollo/react-hooks"
import { Skeleton, Link as ChakraLink } from "@chakra-ui/core"

import { Table } from "@components"
import { moneyRon, encode } from "@utils"
import { SITE_URL } from "@utils/config"

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
          statData?.getEntityList?.map(({ key, count, value, entityId }) => ({
            key: <Link entityId={entityId} name={key} db={db} stat={stat} />,
            count,
            value: moneyRon(value),
          })) || []
        }
      />
    </Skeleton>
  )
}

const Link = ({ entityId, name, db, stat }) => {
  const url = {
    licitatii: {
      firme: `${SITE_URL}/licitatii/firma/${encode(name)}`,
      autoritati: `${SITE_URL}/licitatii/autoritate/${encode(name)}`,
      "coduri-cpv": `${SITE_URL}/licitatii/cpv/${entityId}`,
    },
    achizitii: {
      firme: `${SITE_URL}/achizitii/firma/${entityId}`,
      autoritati: `${SITE_URL}/achizitii/autoritate/${entityId}`,
      "coduri-cpv": `${SITE_URL}/achizitii/cpv/${entityId}`,
    },
  }

  if (stat === "coduri-cpv") return name

  return (
    <ChakraLink href={url[db][stat]} isExternal>
      {name}
    </ChakraLink>
  )
}
