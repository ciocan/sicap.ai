import { getUnixTime } from "date-fns"

export const RESULTS_PER_PAGE = 10

export const searchTerms = [
  "covid",
  "tel drum",
  "SCNA1011723",
  "9524980",
  "pistol",
  "mercedes",
  "coroana",
  "papetarie",
]

export const defaultStartDate = getUnixTime(new Date("2007/01/01"))
export const defaultEndDate = getUnixTime(new Date())
