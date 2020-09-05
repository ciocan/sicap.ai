import React from "react"
import { getSession as getSessionNextAuth } from "next-auth/client"
import ReactMarkdown from "react-markdown"
import { scaleLinear } from "d3-scale"
import { format } from "date-fns"
import { ro } from "date-fns/locale"
import { SHA3, enc } from "crypto-js"
import numeral from "numeral"

import ChakraUIRenderer from "./ChakraUIRenderer"

export const number = (n) => numeral(n).format()

export const moneyRon = (value) =>
  new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    minimumFractionDigits: 0,
  }).format(value)

export const moneyEur = (value) =>
  new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(eur(value))

export const eur = (v) => Math.round(Number(v) / 4.85)

export const date = (d) => d && format(new Date(d), "dd/MM/yyyy")
export const dateTime = (d) => d && format(new Date(d), "dd/MM/yyyy HH:mm")
export const dateFormat = (d, f) => d && format(new Date(d), f, { locale: ro })

export const getDurationInMilliseconds = (start) => {
  const NS_PER_SEC = 1e9
  const NS_TO_MS = 1e6
  const diff = process.hrtime(start)

  return parseInt((diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS)
}

export const ModalContext = React.createContext(() => {})

export const getSession = async (req) => {
  const session = await getSessionNextAuth({ req })

  if (session.user) {
    session.user.hashId = enc.Hex.stringify(SHA3(session.user.email))
  }

  return session
}

export const MD = (source) => (
  <ReactMarkdown
    source={source}
    renderers={ChakraUIRenderer()}
    escapeHtml={false}
    linkTarget="_blank"
  />
)

export const CONFIDENCE_LEVELS = {
  0: {
    title: "Putin probabil",
    description: "Nu esti neaparat sigur ca acest contract poate fi fraudulos.",
  },
  1: {
    title: "Moderat",
    description: "Ceva nu pare in regula, poate pretul este prea mare",
  },
  2: {
    title: "Sever",
    description:
      "Esti destul de sigur ca acest contract este fraudulos. Pretul este mult mai mare decat pe piata libera; descrierea serviciului este destul de vaga si poate induce in eroare.",
  },
}

export const colors = scaleLinear()
  .domain([0, 50, 100])
  .range(["green", "orange", "red"])

export const confidenceRange = scaleLinear().domain([1, 100]).range([0, 2])

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

String.prototype.slugify = function () {
  return this.toLowerCase().replace(" ", "-")
}

export const decode = (str) =>
  typeof btoa === "undefined"
    ? Buffer.from(str, "base64").toString("binary")
    : atob(str)

export const encode = (str) =>
  typeof atob === "undefined"
    ? Buffer.from(str, "binary").toString("base64")
    : btoa(str)

export const isBase64 = (str) => {
  if (!!str.trim() === false) return false

  try {
    return encode(decode(str)) === str
  } catch {
    return false
  }
}
