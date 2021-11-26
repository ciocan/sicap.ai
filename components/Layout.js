import PropTypes from "prop-types"
import Head from "next/head"
import { Grid, Flex } from "@chakra-ui/react"
import { useRouter } from "next/router"

import { Footer, Header } from "@components"

export function Layout({ children }) {
  const { route } = useRouter()
  const pl = route === "/" ? 4 : [4, 4, 32]

  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <Grid
        as="article"
        minHeight="100%"
        backgroundColor="background.main"
        gridTemplateRows="auto 1fr auto"
        gridTemplateColumns="100%"
      >
        <Header />
        <Flex
          as="main"
          p="4"
          pl={pl}
          direction="column"
          justifyContent="flex-start"
          height="100%"
        >
          {children}
        </Flex>
        <Footer />
      </Grid>
    </>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}
