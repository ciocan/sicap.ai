import PropTypes from "prop-types"
import Router from "next/router"
import { MdReportProblem } from "react-icons/md"
import { GoBookmark } from "react-icons/go"
import { FaBriefcase, FaRegBuilding } from "react-icons/fa"
import { Grid, Flex, Box, Text, useDisclosure } from "@chakra-ui/react"

import { moneyRon, moneyEur, dateFormat } from "@utils"
import { Alert } from "@components"
import { ActionItem, Link } from "@components/pages"
import { useBookmarks } from "@hooks"

export const ListItem = ({ data, isBookmarked, db, ...rest }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { handleBookmarkToggle } = useBookmarks(db)

  const {
    id,
    authorityId,
    code,
    title,
    value,
    authority,
    cpvCode,
    date,
    contractType,
    assigmentType,
    procedureType,
    contractState,
    companyId,
    company,
  } = data

  const ron = moneyRon(value)
  const eur = moneyEur(value)

  const handleReport = () => {
    Router.push(
      `/${db}/contract/[...param]`,
      `/${db}/contract/${id}/raporteaza`,
    )
  }

  return (
    <>
      <Alert
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => handleBookmarkToggle(id)}
      />

      <Grid
        templateColumns={["none", "none", "1fr auto"]}
        gap="2"
        bg="white"
        borderWidth="1px"
        borderColor="border.main"
        borderRadius="10px"
        _hover={{ borderColor: "border.selected", bg: "background.selected" }}
        w="100%"
        {...rest}
        css={{ contentVisibility: "auto" }}
      >
        <Flex order={[2, 2, 1]}>
          <Flex pt="6" pl="4" pr="4" alignItems="flex-start">
            <ActionItem
              color={isBookmarked ? "blue" : "grey"}
              icon={GoBookmark}
              label="Adauga la favorite"
              onClick={isBookmarked ? onOpen : () => handleBookmarkToggle(id)}
            />
          </Flex>

          <Box p="4" pl="0">
            <Link
              db={db}
              entity="contract"
              id={id}
              text={`${code} - ${title}`}
              size="md"
              mb="2"
            />

            <Link
              db={db}
              entity="autoritate"
              id={authorityId}
              text={authority}
              icon={FaRegBuilding}
              size="sm"
            />

            {company && (
              <Flex fontSize="sm" py="1">
                <Link
                  db={db}
                  entity="firma"
                  id={companyId}
                  text={company}
                  icon={FaBriefcase}
                  size="sm"
                />
              </Flex>
            )}
            <Text color="black" fontSize="sm" mt="2">
              {cpvCode}
            </Text>
            <Flex fontSize="xs" color="selected" direction="column" mt="2">
              <Text>Tipul contractului: {contractType}</Text>
              {assigmentType && <Text>{assigmentType}</Text>}
              {procedureType && <Text>Tip procedura: {procedureType}</Text>}
              {contractState && (
                <Text>
                  Stare:{" "}
                  <Text
                    as="span"
                    color={[5, 7].includes(contractState.id) ? "black" : "red"}
                  >
                    {contractState.text}
                  </Text>
                </Text>
              )}
            </Flex>
          </Box>
        </Flex>

        <Flex
          order={[1, 1, 2]}
          borderBottom={["1px", "1px", "none"]}
          borderBottomColor={["border.alt", "border.alt", ""]}
        >
          <Flex
            borderRight={["none", "none", "1px"]}
            borderRightColor={["", "", "border.alt"]}
            pr="4"
            width={["70%", "70%", "auto"]}
          >
            <Flex
              direction="column"
              justifyContent="center"
              height="100%"
              pr="4"
              width="100%"
              order={[2, 2, 1]}
            >
              <Text
                color="blue"
                textAlign="right"
                fontSize={["xl", "xl", "md"]}
              >
                {ron}
              </Text>
              <Text
                color="blue"
                textAlign="right"
                fontSize={["xl", "xl", "md"]}
              >
                {eur}
              </Text>
            </Flex>
            <Box alignSelf="center" order={[1, 1, 2]} mx={[4, 4, 0]}>
              <ActionItem
                color="red"
                icon={MdReportProblem}
                label="Raporteaza ca suspicios"
                onClick={handleReport}
              />
            </Box>
          </Flex>
          <Flex
            direction="column"
            p="4"
            mr="2"
            justifyContent="center"
            width={["30%", "30%", "auto"]}
          >
            <Box minWidth="16">
              <Text
                color="blue"
                fontSize="1.6rem"
                fontWeight="bold"
                textAlign="center"
              >
                {dateFormat(date, "dd")}
              </Text>
              <Text
                color="black"
                fontSize="xs"
                textAlign="center"
                textTransform="uppercase"
              >
                {dateFormat(date, "MMMM")}
              </Text>
              <Text color="black" fontSize="xs" textAlign="center">
                {dateFormat(date, "Y")}
              </Text>
            </Box>
          </Flex>
        </Flex>
      </Grid>
    </>
  )
}

ListItem.propTypes = {
  db: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  isBookmarked: PropTypes.bool,
}
