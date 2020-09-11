import { useMemo } from "react"
import { Chart } from "react-charts"
import { useRouter } from "next/router"
import { Box, VStack, Stack, HStack, Text, Link } from "@chakra-ui/core"

import { HiExternalLink } from "react-icons/hi"
import { Paginator } from "@components"

import { moneyRon } from "@utils"

const Note = ({ n, total }) => (
  <Text px="4" pb="4" fontStyle="italic" fontSize="xs">
    <Text fontWeight="bold" color="red" as="span">
      Nota:
    </Text>{" "}
    un numar de <b>{n}</b> din <b>{total}</b> firme nu au fost analizate pentru
    ca lipsesc datele financiare din portalul data.gov.ro{" "}
  </Text>
)

const infoMap = {
  licitatii: <Note n="13,099" total="22,808" />,
  achizitii: <Note n="38,362" total="113,370" />,
}

export function Capusa({ data, loading }) {
  const router = useRouter()
  const [db, opt = "options", page = 1] = router.query?.param || ["licitatii"]

  if (loading || !data) return <Box>Se incarca...</Box>

  const { list, total, value } = data

  return (
    <Box>
      {infoMap[db]}
      <Text p="4">
        Pagina {page} din <b>{total}</b> firme gasite cu valoare totala a
        contractelor de <b>{moneyRon(value)}</b>
      </Text>
      <VStack alignItems="flex-start">
        {list?.map((props, k) => (
          <Company key={k} db={db} {...props} />
        ))}
        <Paginator route="firme-capusa" hits={total} opt={opt} />
      </VStack>
    </Box>
  )
}

const Company = (props) => {
  const {
    db,
    entityId,
    entityName,
    fiscalNumber,
    city,
    county,
    stats: { data, contracts, employees, value },
  } = props

  const series = useMemo(
    () => ({
      type: "area",
    }),
    []
  )

  const axes = useMemo(
    () => [
      { primary: true, position: "bottom", type: "ordinal" },
      { position: "left", type: "linear", stacked: false },
    ],
    []
  )

  return (
    <Stack
      direction={["column", "row"]}
      width="100%"
      justifyContent="space-between"
      alignItems="flex-start"
      bg="white"
      borderWidth="1px"
      borderColor="border.main"
      borderRadius="10px"
      _hover={{ borderColor: "border.selected", bg: "background.selected" }}
      p="4"
    >
      <VStack alignItems="flex-start">
        <HStack spacing="4">
          <Link
            href={`/${db}/firma/${entityId}`}
            isExternal
            as="a"
            fontSize={["sm", "md"]}
            fontWeight="bold"
          >
            {entityName}
          </Link>
          <Link
            href={`https://termene.ro/firma/${fiscalNumber}-`}
            isExternal
            rel="nofollow"
            as="a"
          >
            <HStack spacing="1">
              <HiExternalLink />
              <Text>Termene.ro</Text>
            </HStack>
          </Link>
        </HStack>

        <Text>
          {city}, {county}
        </Text>
        <Text>CUI: {fiscalNumber}</Text>
        <Text>
          {contracts} contracte SICAP in valoare de {moneyRon(value)}
        </Text>
        <Text>Numar mediu de angajati {employees}</Text>
      </VStack>
      <Box w="300px" h="200px">
        <Chart data={data} series={series} axes={axes} tooltip />
      </Box>
    </Stack>
  )
}
