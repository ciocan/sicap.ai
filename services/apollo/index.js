import { useMemo } from "react"
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client"

import { SITE_URL } from "@utils/config"

let apolloClient

function createApolloClient() {
  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    cache: new InMemoryCache(),
    connectToDevTools: true,
    link: new HttpLink({
      uri: `${SITE_URL}/api/graphql`,
      credentials: "same-origin",
    }),
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
