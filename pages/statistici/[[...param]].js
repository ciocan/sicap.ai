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

import { Meta, DatePicker } from "@components"
import { Stats } from "@components/pages"
import { initializeApollo } from "@services/apollo"
import { defaultStartDate, defaultEndDate } from "@utils/constants"

import { STATS } from "@services/queries"

const tabIndex = (tab, data) => data.find((t) => t.slug === tab)?.i

const MakeTabs = ({ data, level = 0, ...rest }) => {
  const router = useRouter()
  const [db, stat = "firme", start = defaultStartDate, end = defaultEndDate] =
    router.query?.param || ["licitatii"]

  const handleTabChange = (id) => {
    router.push(
      `/statistici/[[...param]]`,
      level === 0
        ? `/statistici/${data[id].slug}/${stat}/${start}/${end}`
        : `/statistici/${db}/${data[id].slug}/${start}/${end}`,
      {
        shallow: true,
      },
    )
  }

  const index =
    tabIndex(level === 0 ? db : stat, level === 0 ? dbTabs : statTabs) || 0

  return (
    <Tabs colorScheme="tab" index={index} onChange={handleTabChange} {...rest}>
      <TabList>
        {data.map((t, k) => (
          <Tab key={k}>{t.name}</Tab>
        ))}
      </TabList>
      <TabPanels>
        {data.map((t, k) => (
          <TabPanel key={k}>{t.content}</TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  )
}

const statTabs = [
  { i: 0, name: "Firme", slug: "firme", content: <Stats /> },
  { i: 1, name: "Autoritati", slug: "autoritati", content: <Stats /> },
  { i: 2, name: "Coduri CPV", slug: "coduri-cpv", content: <Stats /> },
]

const dbTabs = [
  {
    i: 0,
    name: "Licitatii publice",
    slug: "licitatii",
    content: <MakeTabs data={statTabs} ml="-4" level={1} />,
  },
  {
    i: 1,
    name: "Achizitii directe",
    slug: "achizitii",
    content: <MakeTabs data={statTabs} ml="-4" level={1} />,
  },
]

export default function Statistici() {
  const router = useRouter()
  const [db, stat = "firme", start, end] = router.query?.param || ["licitatii"]

  const dbName = dbTabs.find((d) => d.slug === db).name.toLowerCase()
  const statName = statTabs.find((d) => d.slug === stat).name.toLowerCase()

  const handleDateChange = (start, end) => {
    router.push(`/statistici/[[...param]]`, `${db}/${stat}/${start}/${end}`)
  }

  return (
    <>
      <Meta
        title={`Statistici ${dbName} | SICAP.ai`}
        description={`Top cheltuieli ${statName} din sistemul de ${dbName}`}
      />
      <Box>
        <DatePicker onChange={handleDateChange} start={start} end={end} />
        <Box my="8">
          <Text fontStyle="italic">
            <b>Nota:</b> Valoarea totala este aproximativa pentru unele
            categorii pentru ca sunt date eronate introduse in sistem.
          </Text>
        </Box>
        <MakeTabs data={dbTabs} />
      </Box>
    </>
  )
}

export const getServerSideProps = async (context) => {
  const [db, stat = "firme", start = defaultStartDate, end = defaultEndDate] =
    context.query?.param || ["licitatii"]

  const variables = { db, stat, start: Number(start), end: Number(end) }

  const apolloClient = initializeApollo()
  await apolloClient.query({ query: STATS, variables })

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
    },
  }
}
