import Link from "next/link"
import { Flex, Box, Stack, Link as ChakraLink } from "@chakra-ui/react"

export const Footer = () => (
  <Flex
    as="footer"
    py="1rem"
    h="3rem"
    justifyContent="center"
    borderTop="1px"
    borderTopColor="border.alt"
  >
    <Stack spacing={4} direction="row" align="center">
      <Box>
        <Link as="/confidentialitate" href="/confidentialitate">
          <ChakraLink>Politica de confidentialitate</ChakraLink>
        </Link>
      </Box>
    </Stack>
  </Flex>
)
