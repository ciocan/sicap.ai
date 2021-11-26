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
} from "@chakra-ui/react"
import { useQuery } from "@apollo/client"
import { FiExternalLink } from "react-icons/fi"
import { MdReportProblem } from "react-icons/md"
import { GoBookmark } from "react-icons/go"
import Router from "next/router"

import { initializeApollo } from "@services/apollo"
import { moneyRon, date } from "@utils"
import { Meta, Alert, Error404 } from "@components"
import { Report, ActionItem, Link } from "@components/pages"
import { DIRECT_CONTRACT } from "@services/queries"
import { useBookmarks } from "@hooks"

function Contract() {
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { bookmarks, handleBookmarkToggle } = useBookmarks("achizitii")
  const [id, feature] = router.query?.param || []
  const isReport = feature === "raporteaza"

  const { data, loading } = useQuery(DIRECT_CONTRACT, {
    variables: { id },
  })

  if (loading) return <Text>se incarca...</Text>
  if (!data?.directContract) {
    return <Error404 />
  }

  const {
    directAcquisitionId,
    directAcquisitionName,
    directAcquisitionDescription,
    uniqueIdentificationCode,
    publicationDate,
    sysDirectAcquisitionState,
    contractingAuthority,
    supplier,
    sysAcquisitionContractType,
    cpvCode,
    closingValue,
    istoric,
    directAcquisitionItems,
  } = data.directContract

  const isBookmarked = bookmarks?.includes(directAcquisitionId)

  const handleReport = () => {
    Router.push(
      `/achizitii/contract/[...param]`,
      `/achizitii/contract/${directAcquisitionId}/raporteaza`,
    )
  }

  return (
    <>
      <Meta
        title={`${uniqueIdentificationCode} ${directAcquisitionName}`}
        description={directAcquisitionDescription}
      />
      <Alert
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => handleBookmarkToggle(directAcquisitionId)}
      />
      {isReport && <Report contractId={directAcquisitionId} db="achizitii" />}
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
            <Text color="blue">{directAcquisitionName}</Text>
          </Flex>
          <HStack>
            <ActionItem
              color={isBookmarked ? "blue" : "grey"}
              icon={GoBookmark}
              label="Adauga la favorite"
              onClick={
                isBookmarked
                  ? onOpen
                  : () => handleBookmarkToggle(directAcquisitionId)
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
                }e-licitatie.ro/pub/direct-acquisition/view/${directAcquisitionId}`}
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
          <RowItem description="ID" content={uniqueIdentificationCode} />
          <RowItem description="Data" content={date(publicationDate)} />
          <RowItem
            description="Stare"
            content={sysDirectAcquisitionState.text}
            color={
              sysDirectAcquisitionState.text !== "Oferta acceptata"
                ? "red"
                : null
            }
          />
          <RowItem
            description="Autoritatea contractanta"
            content={
              <Link
                db="achizitii"
                entity="autoritate"
                id={contractingAuthority.entityId}
                text={`${contractingAuthority.numericFiscalNumber} - ${contractingAuthority.entityName}`}
              />
            }
          />
          <RowItem
            description="Localitate"
            content={`${contractingAuthority.city}, ${contractingAuthority.county}`}
          />
          <RowItem
            description="Furnizor"
            content={
              <Link
                db="achizitii"
                entity="firma"
                id={supplier.entityId}
                text={`${supplier.numericFiscalNumber} - ${supplier.entityName}`}
              />
            }
          />
          <RowItem
            description="Tipul contractului"
            content={sysAcquisitionContractType?.text}
          />
          <RowItem description="Cod CPV" content={cpvCode} />
          <RowItem
            description="Valoare"
            content={moneyRon(closingValue)}
            color="blue"
          />
          <RowItem
            description="Descriere"
            content={directAcquisitionDescription}
          />
          <RowItem
            description="Achizitii"
            content={directAcquisitionItems?.map(
              ({
                directAcquisitionItemID,
                itemClosingPrice,
                itemMeasureUnit,
                itemQuantity,
                catalogItemName,
                catalogItemDescription,
              }) => (
                <Stack
                  key={directAcquisitionItemID}
                  justifyContent="space-between"
                  direction={["column", "column"]}
                  fontSize="sm"
                  mb="6"
                >
                  <Box color="blue">{moneyRon(itemClosingPrice)}</Box>
                  <Box>Cantitate: {itemQuantity}</Box>
                  <Box>Unitate masura: {itemMeasureUnit}</Box>
                  <Box>{catalogItemName}</Box>
                  <Box>{catalogItemDescription}</Box>
                </Stack>
              ),
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
    query: DIRECT_CONTRACT,
    variables,
  })

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
    },
  }
}

export default Contract
