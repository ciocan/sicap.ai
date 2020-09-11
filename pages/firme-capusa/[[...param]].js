import {
  Box,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@chakra-ui/core"
import { useRouter } from "next/router"
import { useQuery } from "@apollo/react-hooks"

import { initializeApollo } from "@services/apollo"
import { Meta } from "@components"
import { Capusa } from "@components/pages"

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
  const [db, opt = "options", page = 1] = router.query?.param || ["licitatii"]

  const tab = tabs.find((d) => d.slug === db)
  const name = tab.name?.toLowerCase()

  const { data, loading } = useQuery(CAPUSA, {
    variables: { db, page: Number(page), opt },
  })

  const handleTabChange = (id) => {
    router.push(
      `/firme-capusa/[[...param]]`,
      `/firme-capusa/${tabs[id].slug}`,
      {
        shallow: true,
      }
    )
  }

  return (
    <>
      <Meta
        title={`Firme capusa | ${name} | SICAP.ai`}
        description={`Lisata firmelor capusa din sistemul de ${name}`}
      />
      <Box>
        <Box my="8">
          <Text fontStyle="italic">
            <b>Nota:</b> O firma este considerata căpuşă atunci cand cifra de
            afaceri declarata la Ministerul Finantelor este foarte apropiata de
            valoarea contractelor de achizitii publice.
          </Text>
        </Box>
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
  const [db, opt = "options", page = 1] = context.query?.param || ["licitatii"]

  const variables = { db, page: Number(page), opt }

  const apolloClient = initializeApollo()
  await apolloClient.query({ query: CAPUSA, variables })

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
    },
  }
}
