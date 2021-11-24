import { useMemo } from "react"
import { ApolloClient, InMemoryCache } from "@apollo/client"
import { SchemaLink } from "@apollo/client/link/schema"

import { SITE_URL } from "@utils/config"
import { schema } from "./schema"

let apolloClient

function createApolloClient() {
  return new ApolloClient({
    link: new SchemaLink({ schema }),
    ssrMode: typeof window === "undefined",
    cache: new InMemoryCache(),
    uri: `${SITE_URL}/api/graphql`,
    connectToDevTools: true,
  })
}

export function initializeApollo(initialState = null) {
  const _apolloClient = apolloClient ?? createApolloClient()

  if (initialState) {
    _apolloClient.cache.restore(initialState)
  }
  if (typeof window === "undefined") return _apolloClient
  if (!apolloClient) apolloClient = _apolloClient

  return _apolloClient
}

export function useApollo(initialState) {
  const store = useMemo(() => initializeApollo(initialState), [initialState])
  return store
}
