import { Box, Tabs, TabList, Tab, TabPanels, TabPanel } from "@chakra-ui/core"
import { useRouter } from "next/router"

import { Meta } from "@components"
import { Stats } from "@components/pages"

const tabIndex = (tab, data) => data.find((t) => t.slug === tab)?.i

const MakeTabs = ({ data, level = 0, ...rest }) => {
  const router = useRouter()
  const [db, stat = "firme"] = router.query?.param || ["licitatii"]

  const handleTabChange = (id) => {
    router.push(
      `/statistici/[[...param]]`,
      level === 0
        ? `/statistici/${data[id].slug}/${stat}`
        : `/statistici/${db}/${data[id].slug}`,
      {
        shallow: true,
      }
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
  const [db, stat = "firme"] = router.query?.param || ["licitatii"]

  const dbName = dbTabs.find((d) => d.slug === db).name.toLowerCase()
  const statName = statTabs.find((d) => d.slug === stat).name.toLowerCase()

  return (
    <>
      <Meta
        title={`Statistici ${dbName} | SICAP.ai`}
        description={`Top cheltuieli ${statName} din sistemul de ${dbName}`}
      />
      <Box>
        <MakeTabs data={dbTabs} />
      </Box>
    </>
  )
}
