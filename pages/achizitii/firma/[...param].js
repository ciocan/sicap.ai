import { useRouter } from "next/router"
import { Box, Text, Heading, Stack } from "@chakra-ui/react"
import { useQuery } from "@apollo/client"

import { Paginator, Meta } from "@components"
import { initializeApollo } from "@services/apollo"
import { ListItem, Chart } from "@components/pages"
import { DIRECT_COMPANY } from "@services/queries"
import { moneyRon, moneyEur } from "@utils"
import { useBookmarks } from "@hooks"
import { transformDirectItem } from "@utils/transformers"

function CompanyPage() {
  const router = useRouter()
  const [id, page = 1] = router.query.param
  const { bookmarks } = useBookmarks("achizitii")

  const { data, loading } = useQuery(DIRECT_COMPANY, {
    variables: { page: parseInt(page), company: id },
  })

  if (loading) return <Text>se incarca...</Text>

  const {
    hits,
    supplier: { city, county, numericFiscalNumber, entityName },
    stats,
    list,
  } = data?.directCompany || { supplier: {} }

  const totalValue = stats.years.map((y) => y.value).reduce((a, b) => a + b, 0)
  const totalValueRon = moneyRon(totalValue)

  const name = ` ${numericFiscalNumber} / ${entityName} / ${city}, ${county}`

  return (
    <>
      <Meta
        title={`${name} - achizitii directe @ SICAP.ai`}
        description={`${hits} achizitii in valoare de ${totalValueRon}`}
      />
      <Box fontSize="xs">
        <Heading fontSize="lg">{name}</Heading>
        <Text my="2">
          <Text as="b">{hits}</Text> contracte in valoare de{" "}
          <Text as="b" color="blue">
            {totalValueRon}
          </Text>{" "}
          / <Text as="b">{moneyEur(totalValue)}</Text>
        </Text>
      </Box>
      <Chart data={stats} />
      <Box fontSize="xs" mt="12">
        <Box as="label" htmlFor="search" color="black">
          <Text mb="4">
            {page && `Pagina ${page} din`} {hits} rezultate
          </Text>
        </Box>
      </Box>
      <Stack spacing={4}>
        {list?.map((item, i) => (
          <ListItem
            key={i}
            data={transformDirectItem(item)}
            isBookmarked={bookmarks?.includes(item.directAcquisitionId)}
            db="achizitii"
          />
        ))}
      </Stack>
      <Paginator route="achizitii/firma" hits={hits} />
    </>
  )
}

export default CompanyPage

export const getServerSideProps = async (context) => {
  const [id, page = 1] = context.query.param

  const variables = { company: id, page: parseInt(page) }

  const apolloClient = initializeApollo()
  await apolloClient.query({ query: DIRECT_COMPANY, variables })

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
    },
  }
}
