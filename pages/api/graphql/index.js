import { ApolloServer } from "apollo-server-micro"
import Cors from "micro-cors"
import { typeDefs, resolvers } from "@services/apollo/schema"
import { createContext } from "@services/apollo/context"

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: createContext,
  playground: true,
  introspection: true,
})

const cors = Cors({
  allowMethods: ["GET", "POST", "OPTIONS"],
})

export const config = {
  api: {
    bodyParser: false,
  },
}

const handler = server.createHandler({ path: "/api/graphql" })

export default cors(handler)
