import {
  Box,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Heading,
} from "@chakra-ui/core"
import { useRouter } from "next/router"
import { useQuery } from "@apollo/react-hooks"

import { initializeApollo } from "@services/apollo"

import { Meta } from "@components"
import {
  Capusa,
  Filter,
  defaultFilterEncoded,
  decodeFilter,
} from "@components/pages"
import { counties } from "@utils/constants"

import { CAPUSA } from "@services/queries"

const tabs = [
  {
    i: 0,
    name: "Licitatii publice",
    slug: "licitatii",
  },
  {
    i: 1,
    name: "Achizitii directe",
    slug: "achizitii",
  },
]

export default function FirmeCapusa() {
  const router = useRouter()
  const [db, filterEncoded = defaultFilterEncoded, page = 1] = router.query
    ?.param || ["licitatii"]

  const tab = tabs.find((d) => d.slug === db)
  const name = tab.name?.toLowerCase()
  const filter = decodeFilter(filterEncoded)
  const hasCounty = filter.county !== counties[0]

  const { data, loading } = useQuery(CAPUSA, {
    variables: { db, page: Number(page), filter: filterEncoded },
  })

  const handleTabChange = (id) => {
    router.push(
      `/firme-capusa/[[...param]]`,
      `/firme-capusa/${tabs[id].slug}/${filterEncoded}`,
      {
        shallow: true,
      }
    )
  }

  const handleFilterChange = (filter) => {
    router.push(
      `/firme-capusa/[[...param]]`,
      `/firme-capusa/${tab.slug}/${filter}/${page}`,
      {
        shallow: true,
      }
    )
  }

  return (
    <>
      <Meta
        title={`Firme capusa ${
          hasCounty ? filter.county : ""
        } | ${name} | SICAP.ai`}
        description={`Lisata firmelor capusa din sistemul de ${name}`}
      />
      <Box>
        <Heading as="h1" fontSize="xl" mt="4">
          Lista firmelor căpuşă {hasCounty && `din judetul ${filter.county}`}
        </Heading>
        <Box my="8">
          <Text fontStyle="italic">
            <b>Nota:</b> O firma este considerata căpuşă atunci cand cifra de
            afaceri declarata la Ministerul Finantelor este foarte apropiata de
            valoarea contractelor de achizitii publice.
          </Text>
        </Box>
        <Filter onChange={handleFilterChange} data={filter} />
        <Tabs colorScheme="tab" index={tab.i || 0} onChange={handleTabChange}>
          <TabList>
            <Tab>{tabs[0].name}</Tab>
            <Tab>{tabs[1].name}</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Capusa data={data?.getCapusaList} loading={loading} />
            </TabPanel>
            <TabPanel>
              <Capusa data={data?.getCapusaList} loading={loading} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </>
  )
}

export const getServerSideProps = async (context) => {
  const [db, filter = defaultFilterEncoded, page = 1] = context.query
    ?.param || ["licitatii"]

  const variables = { db, page: Number(page), filter }

  const apolloClient = initializeApollo()
  await apolloClient.query({ query: CAPUSA, variables })

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
    },
  }
}
