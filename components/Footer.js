import Link from "next/link"
import { Flex, Box, Stack, Link as ChakraLink } from "@chakra-ui/react"

export const Footer = () => (
  <Flex
    as="footer"
    py="1rem"
    justifyContent="center"
    borderTop="1px"
    borderTopColor="border.alt"
  >
    <Stack spacing={2} direction="column" align="center">
      <Link as="/confidentialitate" href="/confidentialitate">
        <ChakraLink>Politica de confidentialitate</ChakraLink>
      </Link>
      <ChakraLink fontSize="0.85rem" target="_blank" href="https://cloudify.ro">Hosting oferit de <Box as="span" color="blue" fontWeight="semibold">Cloudify.ro</Box></ChakraLink>
    </Stack>
  </Flex>
)
