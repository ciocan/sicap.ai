import { useRouter } from "next/router"
import { Box, Text, Heading, Stack } from "@chakra-ui/core"
import { useQuery } from "@apollo/client"

import { Paginator, Meta } from "@components"
import { initializeApollo } from "@services/apollo"
import { ListItem, Chart } from "@components/pages"
import { AUTHORITY } from "@services/queries"
import { moneyRon, moneyEur } from "@utils"
import { useBookmarks } from "@hooks"
import { transformItem } from "@utils/transformers"

function AuthorityPage() {
  const router = useRouter()
  const [id, page = 1] = router.query.param
  const { bookmarks } = useBookmarks("licitatii")

  const { data, loading } = useQuery(AUTHORITY, {
    variables: { page: parseInt(page), authority: id },
  })

  if (loading) return <Text>se incarca...</Text>

  if (!data?.company.caAddress) {
    return <>404</>
  }

  const {
    hits,
    caAddress: { city, contractingAuthorityNameAndFN },
    stats,
    list,
  } = data?.company || { caAddress: {} }

  const totalValue = stats.years.map((y) => y.value).reduce((a, b) => a + b, 0)
  const totalValueRon = moneyRon(totalValue)

  const name = ` ${contractingAuthorityNameAndFN} / ${city}`

  return (
    <>
      <Meta
        title={`${name} - licitatii publice @ SICAP.ai`}
        description={`${hits} licitatii in valoare de ${totalValueRon}`}
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
            data={transformItem(item)}
            isBookmarked={bookmarks?.includes(Number(item.caNoticeId))}
            db="licitatii"
          />
        ))}
      </Stack>
      <Paginator route="licitatii/autoritate" hits={hits} />
    </>
  )
}

export default AuthorityPage

export const getServerSideProps = async (context) => {
  const [id, page = 1] = context.query.param

  const variables = { authority: id, page: parseInt(page) }

  const apolloClient = initializeApollo()
  await apolloClient.query({ query: AUTHORITY, variables })

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
    },
  }
}
