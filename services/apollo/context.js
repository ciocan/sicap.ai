import prisma from "@services/prisma"

export function createContext(context) {
  return { prisma, ...context }
}
