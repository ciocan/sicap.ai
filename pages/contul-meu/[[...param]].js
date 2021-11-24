import PropTypes from "prop-types"
import {
  Button,
  Box,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@chakra-ui/core"
import { signout } from "next-auth/client"
import { useRouter } from "next/router"
import { FiSettings } from "react-icons/fi"
import { MdReportProblem, MdAddAlert } from "react-icons/md"
import { GoBookmark } from "react-icons/go"
import { zipObject } from "lodash"

import { Meta, LoginButton } from "@components"
import {
  ReportList,
  BookmarksList,
  AlertList,
  AccountBenefits,
} from "@components/pages"

const tabs = ["favorite/licitatii", "raportate", "alerte", "setari"]
const tabsMap = zipObject(
  tabs,
  tabs.map((v, i) => i),
)

export default function ContulMeu({ session }) {
  const router = useRouter()
  const [tab = 0] = router.query?.param || [0]

  const handleTabChange = (id) => {
    router.push(`/contul-meu/[[...param]]`, `/contul-meu/${tabs[id]}`, {
      shallow: true,
    })
  }

  return (
    <>
      <Meta
        title="Contul meu | SICAP.ai"
        description="Detector de achizitii frauduloase cu ajutorul inteligentei artificiale"
      />
      <Box>
        {session ? (
          <>
            <Tabs
              colorScheme="tab"
              defaultIndex={tabsMap[tab] || 0}
              onChange={handleTabChange}
            >
              <TabList>
                <Tab>
                  <Box as={GoBookmark} mr="2" />
                  <Text display={["none", "block"]}>Favorite</Text>
                </Tab>
                <Tab>
                  <Box as={MdReportProblem} mr="2" />
                  <Text display={["none", "block"]}>Raporate</Text>
                </Tab>
                <Tab>
                  <Box as={MdAddAlert} mr="2" />
                  <Text display={["none", "block"]}>Alerte</Text>
                </Tab>
                <Tab>
                  <Box as={FiSettings} mr="2" />
                  <Text display={["none", "block"]}>Setari</Text>
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <BookmarksList />
                </TabPanel>
                <TabPanel>
                  <ReportList />
                </TabPanel>
                <TabPanel>
                  <AlertList />
                </TabPanel>
                <TabPanel>
                  <Button
                    m="4"
                    aria-label="Deconectare"
                    color="orange.500"
                    onClick={signout}
                  >
                    Deconectare
                  </Button>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </>
        ) : (
          <>
            <AccountBenefits />
            <LoginButton />
          </>
        )}
      </Box>
    </>
  )
}

ContulMeu.propTypes = {
  session: PropTypes.object,
}
