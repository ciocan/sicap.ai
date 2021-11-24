import PropTypes from "prop-types"
import { useRouter } from "next/router"
import { Stack, Box, Text } from "@chakra-ui/core"
import { useQuery } from "@apollo/client"

import { Paginator, Meta } from "@components"
import { initializeApollo } from "@services/apollo"
import { ListItem } from "@components/pages"
import { DIRECT_CONTRACTS } from "@services/queries"
import { useBookmarks } from "@hooks"
import { transformDirectItem } from "@utils/transformers"

function ListPage() {
  const router = useRouter()
  const [query, page = 1] = router.query.param
  const { bookmarks } = useBookmarks("achizitii")

  const { data, loading } = useQuery(DIRECT_CONTRACTS, {
    variables: { page: parseInt(page), query },
  })

  if (loading) return <Text>se incarca...</Text>

  const { hits = 0, list = [] } = data?.directContracts || {}

  return (
    <>
      <Meta
        title={query}
        description={`Cautare licitatii publice cuvint(e) cheie: ${query}`}
      />
      <Box fontSize="xs">
        <Box as="label" htmlFor="search" color="black">
          <Text mb="4">
            {page && `Pagina ${page} din`} {hits} rezultate pentru{" "}
            <Text as="b">{query.replace("+", " ")}</Text>
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
      <Paginator route="achizitii" hits={hits} />
    </>
  )
}

ListPage.propTypes = {
  session: PropTypes.object,
}

export default ListPage

export const getServerSideProps = async (context) => {
  const [query, page = 1] = context.query.param
  const variables = { query, page: parseInt(page) }

  const apolloClient = initializeApollo()
  await apolloClient.query({
    query: DIRECT_CONTRACTS,
    variables,
  })

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
    },
  }
}
