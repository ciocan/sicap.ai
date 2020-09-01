import Link from "next/link"
import { useRouter } from "next/router"

import {
  Link as ChakraLink,
  Grid,
  Flex,
  Box,
  Text,
  Stack,
  Avatar,
} from "@chakra-ui/core"
import { BsQuestionSquare as AboutIcon } from "react-icons/bs"
import { FaUserNinja } from "react-icons/fa"
import { useSession } from "next-auth/client"

import { SearchBar } from "@components"

export function Header() {
  const router = useRouter()

  const {
    route,
    query: { param = [] },
  } = router
  const [query] =
    route === "/licitatii/[...param]" || route === "/achizitii/[...param]"
      ? param
      : []
  const isHome = route === "/"

  const gridProps = !isHome && {
    background: "white",
    borderBottom: "1px",
    borderBottomColor: "border.main",
  }

  return (
    <Grid
      as="nav"
      py="4"
      px="4"
      {...gridProps}
      gridTemplateColumns="auto 1fr auto auto auto"
      alignItems="center"
    >
      {!isHome && <Logo />}
      <Box mx="8">{!isHome && <SearchBar query={query} hide />}</Box>
      <About />
      <User />
    </Grid>
  )
}

const Logo = () => (
  <Link href="/" as="/" passHref>
    <Flex as="a" color="blue" w="16">
      <Text as="b">SICAP</Text>
      <Text>.ai</Text>
    </Flex>
  </Link>
)

const About = () => {
  return (
    <Link href="/despre" as="/despre" passHref>
      <ChakraLink
        _hover={{ textDecoration: "underline" }}
        justifySelf="end"
        color="black"
        outline="none"
      >
        <Box
          as={AboutIcon}
          color="blue"
          boxSize="1.5em"
          display={{ sm: "block", md: "none" }}
        />
        <Text display={["none", "none", "block"]}>Despre</Text>
      </ChakraLink>
    </Link>
  )
}

const User = () => {
  const [session] = useSession()

  return (
    <Link href="/contul-meu/[[...param]]" as="/contul-meu" passHref>
      <ChakraLink
        mx="4"
        aria-label="contul meu"
        color="white"
        backgroundColor="blue"
        borderRadius="md"
      >
        <Stack
          p="1"
          px="3"
          direction="row"
          spacing={{ sm: 0, md: 2 }}
          align="center"
        >
          {session ? (
            <Avatar
              size="xs"
              name={session.user.name}
              src={session.user.image}
            />
          ) : (
            <FaUserNinja />
          )}
          <Text px="2" display={["none", "none", "block"]}>
            Contul meu
          </Text>
        </Stack>
      </ChakraLink>
    </Link>
  )
}
