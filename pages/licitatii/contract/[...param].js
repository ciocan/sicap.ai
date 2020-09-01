import { useRouter } from "next/router"
import {
  useDisclosure,
  Box,
  Text,
  Link as ChakraLink,
  Flex,
  Stack,
  HStack,
  Grid,
} from "@chakra-ui/core"
import { useQuery } from "@apollo/react-hooks"
import { FiExternalLink } from "react-icons/fi"
import { MdReportProblem } from "react-icons/md"
import { GoBookmark } from "react-icons/go"
import Router from "next/router"

import { initializeApollo } from "@services/apollo"
import { moneyRon, date, encode } from "@utils"
import { Meta, Alert } from "@components"
import { Report, ActionItem, Link } from "@components/pages"
import { CONTRACT } from "@services/queries"
import { useBookmarks } from "@hooks"

function Contract() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const router = useRouter()
  const { bookmarks, handleBookmarkToggle } = useBookmarks("licitatii")
  const [id, feature] = router.query?.param || []
  const isReport = feature === "raporteaza"

  const { data, loading } = useQuery(CONTRACT, {
    variables: { id },
  })

  if (loading) return <Text>se incarca...</Text>
  if (!data?.contract) {
    // TODO: redirect to 404
    return <Text>404</Text>
  }

  const {
    contractTitle,
    ronContractValue,
    contractValue,
    cityItem,
    city,
    county,
    cpvCodeAndName,
    sysProcedureState,
    sysProcedureType,
    sysAcquisitionContractType,
    contractingAuthorityNameAndFN,
    noticeStateDate,
    shortDescription,
    caNoticeId,
    noticeNo,
    winners,
    entityId,
    istoric,
    descriptionList,
  } = data.contract

  const isBookmarked = bookmarks?.includes(Number(caNoticeId))

  const handleReport = () => {
    Router.push(
      `/licitatii/contract/[...param]`,
      `/licitatii/contract/${caNoticeId}/raporteaza`
    )
  }

  return (
    <>
      <Meta
        title={`${noticeNo} ${contractTitle}`}
        description={shortDescription}
      />
      <Alert
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => handleBookmarkToggle(caNoticeId)}
      />
      {isReport && <Report contractId={Number(caNoticeId)} db="licitatii" />}
      <Box
        bg="white"
        p="4"
        borderRadius="lg"
        border="1px"
        borderColor="border.main"
      >
        <Stack
          spacing="4"
          justifyContent="space-between"
          direction={["column", "row"]}
        >
          <Flex alignItems="center">
            <Text color="blue">{contractTitle}</Text>
          </Flex>
          <HStack>
            <ActionItem
              color={isBookmarked ? "blue" : "grey"}
              icon={GoBookmark}
              label="Adauga la favorite"
              onClick={
                isBookmarked ? onOpen : () => handleBookmarkToggle(caNoticeId)
              }
            />
            <ActionItem
              color="red"
              icon={MdReportProblem}
              label="Raporteaza ca suspicios"
              onClick={handleReport}
            />
            <Box>
              <ChakraLink
                href={`https://www.${
                  istoric ? "istoric." : ""
                }e-licitatie.ro/pub/notices/ca-notices/view-c/${caNoticeId}`}
                isExternal
                rel="nofollow"
              >
                <Flex
                  alignItems="center"
                  p="2"
                  borderWidth="1px"
                  borderRadius="lg"
                  as="span"
                >
                  <Text as="span">SEAP </Text>
                  <Box as={FiExternalLink} mx="2px" />
                </Flex>
              </ChakraLink>
            </Box>
          </HStack>
        </Stack>

        <Grid templateColumns={["repeat(1, auto)", "repeat(2, auto)"]} mt="2">
          <RowItem description="ID" content={noticeNo} />
          <RowItem description="Data" content={date(noticeStateDate)} />
          <RowItem
            description="Stare"
            content={sysProcedureState.text}
            color={sysProcedureState.text === "Anulata" ? "red" : null}
          />
          <RowItem
            description="Autoritatea contractanta"
            content={
              <Link
                db="licitatii"
                entity="autoritate"
                id={entityId || encode(contractingAuthorityNameAndFN)}
                text={contractingAuthorityNameAndFN}
              />
            }
          />
          <RowItem
            description="Localitate"
            content={
              cityItem && county ? `${cityItem?.text} / ${county?.text}` : city
            }
          />
          <RowItem
            description={`Furnizor${winners?.length > 1 ? "i" : ""}`}
            content={winners?.map(({ fiscalNumber, name, entityId }) => (
              <Box key={fiscalNumber}>
                <Link
                  db="licitatii"
                  entity="firma"
                  id={entityId || encode(name)}
                  text={`${fiscalNumber} ${name}`}
                />
              </Box>
            ))}
          />
          <RowItem
            description="Tip procedura"
            content={sysProcedureType.text}
          />
          <RowItem
            description="Tipul contractului"
            content={sysAcquisitionContractType.text}
          />
          <RowItem description="Cod CPV" content={cpvCodeAndName} />
          <RowItem
            description="Valoare"
            content={moneyRon(ronContractValue || contractValue)}
            color="blue"
          />
          <RowItem description="Descriere" content={shortDescription} />
          <RowItem
            description="Loturi"
            content={descriptionList?.map(
              ({
                lotNumber,
                contractTitle,
                estimatedValue,
                mainLocation,
                shortDescription,
              }) => (
                <Stack
                  key={lotNumber}
                  justifyContent="space-between"
                  direction={["column", "column"]}
                  fontSize="sm"
                  mb="6"
                >
                  {estimatedValue && (
                    <Box color="blue">{moneyRon(estimatedValue)}</Box>
                  )}
                  <Box>{mainLocation}</Box>
                  <Box>{contractTitle}</Box>
                  <Box>{shortDescription}</Box>
                </Stack>
              )
            )}
          />
        </Grid>
      </Box>
    </>
  )
}

const RowItem = ({ description, content, color }) => (
  <>
    <Box
      color="grey"
      borderBottom="1px"
      borderBottomColor="border.alt"
      pt="2"
      pb="2"
      pr="2"
    >
      {description}:
    </Box>
    <Box
      borderBottom="1px"
      borderBottomColor="border.alt"
      pt="2"
      pb="2"
      color={color}
    >
      {content}
    </Box>
  </>
)

export const getServerSideProps = async (context) => {
  const [id] = context.query?.param || []

  const variables = { id }

  const apolloClient = initializeApollo()
  await apolloClient.query({
    query: CONTRACT,
    variables,
  })

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
    },
  }
}

export default Contract
