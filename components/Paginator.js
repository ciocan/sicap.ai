import PropTypes from "prop-types"
import { useRouter } from "next/router"
import Link from "next/link"
import { Stack, Box, Text } from "@chakra-ui/core"

import { RESULTS_PER_PAGE } from "@utils/constants"

export function Paginator({ route, opt, hits }) {
  const router = useRouter()
  const [query, strPage = 1, tabPage] = router.query?.param || [opt, 1, 1]

  const page = opt ? parseInt(tabPage || 1) : parseInt(strPage || 1)
  const href = opt ? `/${route}/[[...param]]` : `/${route}/[...param]`
  const getPage = (n) =>
    opt
      ? `/${route}/${query}/${opt}/${page + n}`
      : `/${route}/${query}/${page + n}`

  return (
    <Box my="4">
      <Stack spacing="2" my="4" direction="row">
        {page > 1 && (
          <Link href={href} as={getPage(-1)} passHref prefetch={false}>
            <Text color="black" as="a" bg="blue.100" p="2">
              Pagina precedenta
            </Text>
          </Link>
        )}
        {page * RESULTS_PER_PAGE < hits && (
          <Link href={href} as={getPage(1)} passHref prefetch={false}>
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
