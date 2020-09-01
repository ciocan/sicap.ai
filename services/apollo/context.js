import { PrismaClient } from "@prisma/client"
import apm from "elastic-apm-node/start"

const prisma = new PrismaClient()

export function createContext(context) {
  return { prisma, apm, ...context }
}
