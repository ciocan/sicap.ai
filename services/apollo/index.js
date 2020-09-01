import { useMemo } from "react"
import { ApolloClient } from "apollo-client"
import { InMemoryCache } from "apollo-cache-inmemory"
import { HttpLink } from "apollo-link-http"
import { SchemaLink } from "apollo-link-schema"

import { schema } from "./schema"

let apolloClient

function createIsomorphLink() {
  if (typeof window === "undefined") {
    return new SchemaLink({ schema })
  } else {
    return new HttpLink({
      uri: "/api/graphql",
      credentials: "same-origin",
    })
  }
}

function createApolloClient() {
  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link: createIsomorphLink(),
    cache: new InMemoryCache(),
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
