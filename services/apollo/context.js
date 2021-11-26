import apm from "elastic-apm-node/start"

import prisma from "@services/prisma"

export function createContext(context) {
  return { prisma, apm, ...context }
}
