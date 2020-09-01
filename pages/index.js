import { useState } from "react"
import PropTypes from "prop-types"
import Link from "next/link"
import { Flex, Stack, Text } from "@chakra-ui/core"
import { SearchBar, Meta } from "@components"
import { shuffle, take, flow } from "lodash/fp"
import { initializeApollo } from "@services/apollo"
import { useQuery } from "@apollo/react-hooks"

import { searchTerms } from "@utils/constants"
import { number } from "@utils"
import { TOTAL } from "@services/queries"

export default function Homepage(props) {
  const [db, setDb] = useState("licitatii")
  const { data } = useQuery(TOTAL)
  const { terms } = props

  return (
    <>
      <Meta
        title="SICAP.ai - cauta achizitii publice"
        description="Motor de cautare pentru achizitii publice"
      />
      <Flex justifyContent="center" my="auto">
        <Stack alignItems="center">
          <Flex
            as="label"
            htmlFor="search"
            justifyContent="center"
            fontSize="64px"
            color="blue"
          >
            <b>SICAP</b>.ai
          </Flex>
          <Stack spacing="1" direction={["column", "row"]}>
            <Text fontSize="xs">
              {number(data?.total?.licitatii)} licitatii publice si
            </Text>
            <Text fontSize="xs">
              {number(data?.total?.achizitii)} achizitii directe indexate
            </Text>
          </Stack>
          <SearchBar onChangeDb={(d) => setDb(d)} />
          <Stack py="2" spacing="2" direction="row" justifyContent="center">
            <Text as="a" color="grey" fontSize="xs">
              Ex:
            </Text>
            {terms?.map((term) => (
              <Link
                key={term}
                href={`/${db}/[...param]`}
                as={`/${db}/${term}`}
                passHref
                prefetch={false}
              >
                <Text color="grey" as="a" fontSize="xs" textDecor="underline">
                  {term}
                </Text>
              </Link>
            ))}
          </Stack>
        </Stack>
      </Flex>
    </>
  )
}

Homepage.propTypes = {
  terms: PropTypes.array.isRequired,
}

export const getServerSideProps = async () => {
  const apolloClient = initializeApollo()
  await apolloClient.query({
    query: TOTAL,
  })

  return {
    props: {
      terms: flow(shuffle, take(5))(searchTerms),
      initialApolloState: apolloClient.cache.extract(),
    },
  }
}
