import { useRouter } from "next/router"
import { Box, Text, Heading, Stack } from "@chakra-ui/core"
import { useQuery } from "@apollo/client"

import { Paginator, Meta } from "@components"
import { initializeApollo } from "@services/apollo"
import { ListItem, Chart } from "@components/pages"
import { COMPANY } from "@services/queries"
import { moneyRon, moneyEur } from "@utils"
import { useBookmarks } from "@hooks"
import { transformItem } from "@utils/transformers"

function CompanyPage() {
  const router = useRouter()
  const [id, page = 1] = router.query.param
  const { bookmarks } = useBookmarks("licitatii")

  const { data, loading } = useQuery(COMPANY, {
    variables: { page: parseInt(page), company: id },
  })

  if (loading) return <Text>se incarca...</Text>

  if (!data?.company.winner) {
    return <>404</>
  }

  const {
    hits,
    winner: { name, address, fiscalNumber },
    stats,
    list,
  } = data?.company || { winner: {} }

  const totalValue = stats?.years.map((y) => y.value).reduce((a, b) => a + b, 0)
  const totalValueRon = moneyRon(totalValue)

  return (
    <>
      <Meta
        title={`${name} / ${fiscalNumber} / ${address?.city} @ SICAP.ai`}
        description={`${hits} contracte in valoare de ${totalValueRon}`}
      />
      <Box fontSize="xs">
        <Heading fontSize="lg">{name}</Heading>
        <Text>
          Cod fiscal: {fiscalNumber} | {address?.city}
        </Text>
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
            data={transformItem(item)}
            isBookmarked={bookmarks?.includes(Number(item.caNoticeId))}
            db="licitatii"
          />
        ))}
      </Stack>
      <Paginator route="licitatii/firma" hits={hits} />
    </>
  )
}

export default CompanyPage

export const getServerSideProps = async (context) => {
  const [id, page = 1] = context.query.param

  const variables = { company: id, page: parseInt(page) }

  const apolloClient = initializeApollo()
  await apolloClient.query({ query: COMPANY, variables })

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
    },
  }
}
