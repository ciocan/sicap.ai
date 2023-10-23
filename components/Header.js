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
  HStack,
  Icon,
} from "@chakra-ui/react"
import { BsQuestionSquare as AboutIcon } from "react-icons/bs"
import { ImStatsBars as StatsIcon } from "react-icons/im"
import { FaUserNinja } from "react-icons/fa"
import { GiTick as TickIcon } from "react-icons/gi"
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
    <Box>
      <Stack bg="#FFF9BA" align="center" py="2">
        <ChakraLink
          href="https://v2.sicap.ai"
          target="_blank"
          color="red"
          fontWeight="semibold"
          textAlign="center"
          px="40px"
          fontSize="14px"
        >
          NOU: Incearca noua varianta si testeaza cautarea avansata
        </ChakraLink>
      </Stack>
      <Grid
        as="nav"
        py="4"
        px="4"
        {...gridProps}
        gridTemplateColumns="auto 1fr auto auto auto auto"
        alignItems="center"
      >
        {!isHome && <Logo />}
        <Box mx="8">{!isHome && <SearchBar query={query} hide />}</Box>
        <Capusa selected={route.includes("firme-capusa")} />
        <Stats selected={route.includes("statistici")} />
        <About selected={route.includes("despre")} />
        <User />
      </Grid>
    </Box>
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

const About = ({ selected }) => {
  return (
    <Link href="/despre" as="/despre" passHref>
      <ChakraLink
        _hover={{ textDecoration: "underline" }}
        justifySelf="end"
        color="black"
        outline="none"
        as={HStack}
      >
        <Icon
          as={AboutIcon}
          color="blue"
          boxSize="1.5em"
          display={{ sm: "block", md: "none" }}
        />
        <Text
          display={["none", "none", "block"]}
          color={selected ? "blue" : "black"}
        >
          Despre
        </Text>
      </ChakraLink>
    </Link>
  )
}

const Stats = ({ selected }) => {
  return (
    <Link href="/statistici/[[...param]]" as="/statistici" passHref>
      <ChakraLink
        _hover={{ textDecoration: "underline" }}
        justifySelf="end"
        color="black"
        outline="none"
        mr="4"
      >
        <HStack>
          <Box as={StatsIcon} color="blue" boxSize="1.5em" />
          <Text
            display={["none", "none", "block"]}
            color={selected ? "blue" : "black"}
          >
            Statistici
          </Text>
        </HStack>
      </ChakraLink>
    </Link>
  )
}

const Capusa = ({ selected }) => {
  return (
    <Link href="/firme-capusa/[[...param]]" as="/firme-capusa" passHref>
      <ChakraLink
        _hover={{ textDecoration: "underline" }}
        justifySelf="end"
        color="black"
        outline="none"
        mr="4"
      >
        <HStack>
          <Box as={TickIcon} color="blue" boxSize="1.5em" />
          <Text
            display={["none", "none", "block"]}
            color={selected ? "blue" : "black"}
          >
            Firme căpuşă
          </Text>
        </HStack>
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
