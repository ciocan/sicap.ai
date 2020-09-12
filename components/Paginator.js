import PropTypes from "prop-types"
import { useRouter } from "next/router"
import Link from "next/link"
import { Stack, Box, Text } from "@chakra-ui/core"

import { RESULTS_PER_PAGE } from "@utils/constants"

export function Paginator({ route, opt, hits }) {
  const router = useRouter()
  const [q1, q2, q3] = router.query?.param || []

  const searchParam = {
    page: parseInt(q2) || 1,
    href: `/${route}/[...param]`,
    as: (n) => `/${route}/${q1}/${(parseInt(q2) || 1) + n}`,
  }

  const routeMap = {
    "contul-meu": {
      page: parseInt(q3) || 1,
      href: `/${route}/[[...param]]`,
      as: (n) =>
        `/${route}/${q1 || "favorite"}/${opt}/${(parseInt(q3) || 1) + n}`,
    },
    "firme-capusa": {
      page: parseInt(q3) || 1,
      href: `/${route}/[[...param]]`,
      as: (n) =>
        `/${route}/${q1 || "licitatii"}/${opt}/${(parseInt(q3) || 1) + n}`,
    },
    achizitii: searchParam,
    licitatii: searchParam,
    "achizitii/autoritate": searchParam,
    "achizitii/firma": searchParam,
    "licitatii/autoritate": searchParam,
    "licitatii/firma": searchParam,
  }

  return (
    <Box my="4">
      <Stack spacing="2" my="4" direction="row">
        {routeMap[route].page > 1 && (
          <Link
            href={routeMap[route].href}
            as={routeMap[route].as(-1)}
            passHref
            prefetch={false}
          >
            <Text color="black" as="a" bg="blue.100" p="2">
              Pagina precedenta
            </Text>
          </Link>
        )}
        {routeMap[route].page * RESULTS_PER_PAGE < hits && (
          <Link
            href={routeMap[route].href}
            as={routeMap[route].as(1)}
            passHref
            prefetch={false}
          >
            <Text color="black" as="a" bg="blue.100" p="2">
              Pagina urmatoare
            </Text>
          </Link>
        )}
      </Stack>
    </Box>
  )
}

Paginator.propTypes = {
  hits: PropTypes.number.isRequired,
  route: PropTypes.string.isRequired,
  opt: PropTypes.string,
}
