import PropTypes from "prop-types"
import NextLink from "next/link"
import { Stack, Box, Text, Link as ChakraLink } from "@chakra-ui/core"
import ReactHtmlParser from "react-html-parser"

export function Link({ db, id, text, icon, entity, size, ...rest }) {
  return (
    <NextLink
      href={`/${db}/${entity}/[...param]`}
      as={`/${db}/${entity}/${id}`}
      passHref
      prefetch={false}
    >
      <ChakraLink as="a" fontSize={size}>
        <Stack direction="row" alignItems="center" {...rest}>
          {icon && <Box as={icon} boxSize="1em" color="grey" />}
          <Text>{ReactHtmlParser(text)}</Text>
        </Stack>
      </ChakraLink>
    </NextLink>
  )
}

Link.propTypes = {
  db: PropTypes.string.isRequired,
  id: PropTypes.number.isRequired,
  text: PropTypes.string.isRequired,
  icon: PropTypes.func,
  entity: PropTypes.string.isRequired,
  size: PropTypes.string,
}
