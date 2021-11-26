import {
  Text,
  Stack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react"
import { useQuery } from "@apollo/client"
import { useRouter } from "next/router"
import { useSession } from "next-auth/client"

import { Paginator } from "@components"
import { ListItem } from "@components/pages"
import { useMe } from "@hooks"
import { transformItem, transformDirectItem } from "@utils/transformers"

const tabs = ["favorite/licitatii", "favorite/achizitii"]
const tabsMap = {
  licitatii: 0,
  achizitii: 1,
}

import {
  BOOKMARKED_CONTRACTS_L,
  BOOKMARKED_CONTRACTS_A,
} from "@services/queries"

export function BookmarksList() {
  const router = useRouter()
  const [, tab = 0] = router.query?.param || [0]

  const handleTabChange = (id) => {
    router.push(`/contul-meu/[[...param]]`, `/contul-meu/${tabs[id]}`, {
      shallow: true,
    })
  }

  return (
    <Tabs
      colorScheme="tab"
      index={tabsMap[tab] || 0}
      onChange={handleTabChange}
      mx="-16px"
    >
      <TabList>
        <Tab>Licitatii publice</Tab>
        <Tab>Achizitii directe</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <ContractsList db="licitatii" />
        </TabPanel>
        <TabPanel>
          <ContractsList db="achizitii" />
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}

function ContractsList({ db }) {
  const [session] = useSession()
  const router = useRouter()
  const { bookmarks, loading } = useMe()
  const [, , page = 1] = router.query?.param || [0, 0, 1]

  const isLicitatii = db === "licitatii"

  const { data } = useQuery(
    isLicitatii ? BOOKMARKED_CONTRACTS_L : BOOKMARKED_CONTRACTS_A,
    {
      variables: {
        db,
        page: parseInt(page),
        bookmarks:
          bookmarks?.filter((b) => b.db === db).map((b) => b.contractId) || [],
      },
      skip: !session && !bookmarks,
    },
  )

  const { hits = 0, list = [] } = data?.bookmarkedContracts || {}

  if (loading) return <Text>se incarca...</Text>
  if (!data || !list) return null

  return (
    <>
      <Text m="4">
        Pagina {page} din {hits} rezultate
      </Text>
      <Stack spacing={4}>
        {list?.map((item, i) => {
          const contractId = isLicitatii
            ? Number(item.caNoticeId)
            : item.directAcquisitionId
          const dataItem = isLicitatii
            ? transformItem(item)
            : transformDirectItem(item)

          return (
            <ListItem
              key={i}
              data={dataItem}
              isBookmarked={true}
              db={bookmarks.find((b) => b.contractId === contractId)?.db}
            />
          )
        })}
      </Stack>
      <Paginator route="contul-meu" opt={db} hits={hits} />
    </>
  )
}
