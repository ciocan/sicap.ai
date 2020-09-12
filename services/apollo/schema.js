import { makeExecutableSchema } from "graphql-tools"
import gql from "graphql-tag"

import {
  getContracts,
  getContract,
  getCompany,
  getBookmarkedContracts,
} from "@services/resolvers/elastic/licitatii/"

import {
  getDirectContracts,
  getDirectCompany,
  getDirectContract,
} from "@services/resolvers/elastic/achizitii/"

import { saveAlert, getAlerts, getTotal } from "@services/resolvers/elastic/"

import {
  getMe,
  toggleBookmark,
  getBookmarks,
  submitReport,
  getReports,
} from "@services/resolvers/user"

import { getEntityList, getCapusaList } from "@services/resolvers/elastic/stats"

export const typeDefs = gql`
  union ContractResult = Contracts | DirectContracts

  type Query {
    me: User
    total: Total
    contracts(query: String!, page: Int): Contracts
    contract(id: String!): Contract
    bookmarks: [Bookmark!]!
    reports: [Report!]!
    company(authority: String, company: String, page: Int): Company
    alerts: [String!]!
    directContracts(query: String!, page: Int): DirectContracts
    directCompany(authority: String, company: String, page: Int): DirectCompany
    directContract(id: Int!): DirectContract
    bookmarkedContracts(
      bookmarks: [Int!]
      page: Int
      db: String
    ): ContractResult
    getEntityList(db: String!, stat: String!, start: Int, end: Int): [Stat]
    getCapusaList(db: String!, page: Int, opt: String): CapusaList
  }

  type Mutation {
    toggleBookmark(contractId: Int!, db: String!): [Bookmark]!
    submitReport(
      contractId: Int!
      confidence: Int!
      comment: String!
      db: String!
    ): Report
    saveAlert(cui: [String!]!): Boolean
  }

  type Total {
    licitatii: Int!
    achizitii: Int!
  }

  type Company {
    ms: Int!
    size: Int!
    hits: Int!
    caAddress: CaAddress
    winner: Winner
    list: [Contract]
    stats: Stats
  }

  type Stats {
    years: [Stat]
    months: [Stat]
  }

  type Stat {
    key: String
    count: Int
    value: Float
    entityId: String
  }

  type User {
    id: ID!
    hashId: String!
    createdAt: String!
    updatedAt: String!
    bookmarks: [Bookmark!]!
    reports: [Report!]
  }

  type Report {
    id: ID!
    createdAt: String!
    user: User!
    contractId: Int!
    db: Db!
    confidence: Int!
    comment: String!
  }

  type Bookmark {
    contractId: Int!
    db: Db!
    createdAt: String!
  }

  enum Db {
    licitatii
    achizitii
  }

  type Contract {
    ms: Int
    entityId: Int
    caNoticeId: String
    noticeNo: String
    contractingAuthorityNameAndFN: String
    caAddress: CaAddress
    contractTitle: String
    sysAcquisitionContractType: Item
    sysProcedureType: Item
    sysContractAssigmentType: Item
    sysNoticeState: Item
    sysProcedureState: Item
    cpvCodeAndName: String
    noticeStateDate: String
    ronContractValue: String
    contractValue: String
    title: String
    shortDescription: String
    descriptionList: [DescriptionList]
    contractDate: String
    city: String
    cityItem: Item
    county: Item
    winners: [Winner]
    winner: Winner
    istoric: Boolean
  }

  type CaAddress {
    contractingAuthorityNameAndFN: String
    nationalIDNumber: String
    officialName: String
    address: String
    city: String
    postalCode: String
    nutsCodeItem: Item
  }

  type Winner {
    entityId: Int
    name: String
    fiscalNumber: String
    fiscalNumberInt: String
    address: WinnerAddress
  }

  type WinnerAddress {
    address: String
    city: String
    postalCode: String
    county: County
  }

  type County {
    localeKey: String
    text: String
  }

  type DescriptionList {
    lotInfo: String
    lotNumber: String
    shortDescription: String
    mainLocation: String
    contractTitle: String
    mainCPVCodes: Item
    secondaryCPVCodes: [Item]
    monthDuration: Int
    dayDuration: Int
    estimatedValue: String
  }

  type Item {
    id: Int
    text: String
  }

  type Contracts {
    ms: Int!
    hits: Int!
    list: [Contract]
  }

  type DirectContracts {
    ms: Int!
    hits: Int!
    list: [DirectContract]
  }

  type DirectContract {
    ms: Int
    directAcquisitionId: Int
    directAcquisitionName: String
    sysDirectAcquisitionState: Item
    uniqueIdentificationCode: String
    cpvCode: String
    publicationDate: String
    supplier: Supplier
    contractingAuthority: ContractingAuthority
    closingValue: Float
    directAcquisitionDescription: String
    directAcquisitionItems: [DirectAcquisitionItems]
    sysAcquisitionContractType: Item
    istoric: Boolean
  }

  type Supplier {
    entityId: Int
    numericFiscalNumber: String
    entityName: String
    city: String
    county: String
    country: String
    postalCode: String
  }

  type ContractingAuthority {
    isUtility: Boolean
    entityId: Int
    numericFiscalNumber: String
    entityName: String
    city: String
    county: String
    country: String
    postalCode: String
  }

  type DirectAcquisitionItems {
    directAcquisitionItemID: Int
    catalogItemName: String
    catalogItemDescription: String
    itemClosingPrice: Float
    itemQuantity: Int
    itemMeasureUnit: String
    cpvCode: Item
  }

  type DirectCompany {
    ms: Int!
    size: Int!
    hits: Int!
    contractingAuthority: ContractingAuthority
    supplier: Supplier
    list: [DirectContract]
    stats: Stats
  }

  type CapusaList {
    total: Int
    value: Float
    list: [Capusa]
  }

  type Capusa {
    entityId: Int
    fiscalNumber: Int
    entityName: String
    city: String
    county: String
    stats: CapusaStats
  }

  type CapusaStats {
    contracts: Int
    employees: Int
    value: Float
    data: [CapusaData]
  }

  type CapusaSeries {
    primary: Int
    secondary: Float
  }

  type CapusaData {
    label: String
    data: [CapusaSeries]
  }
`

export const resolvers = {
  ContractResult: {
    __resolveType(obj, context, info) {
      if (info.variableValues.db === "licitatii") return "Contracts"
      if (info.variableValues.db === "achizitii") return "DirectContracts"
      return null
    },
  },
  Query: {
    me: async (_, args, ctx) => await getMe(ctx),
    total: async () => await getTotal(),
    bookmarks: async (_, args, ctx) => await getBookmarks(ctx),
    reports: async (_, args, ctx) => await getReports(ctx),
    alerts: async (_, args, ctx) => await getAlerts(ctx),
    company: async (_, args, ctx) => await getCompany(args, ctx),
    contracts: async (_, args) => await getContracts(args),
    contract: async (_, args) => await getContract(args),
    directContracts: async (_, args) => await getDirectContracts(args),
    directCompany: async (_, args, ctx) => await getDirectCompany(args, ctx),
    directContract: async (_, args, ctx) => await getDirectContract(args, ctx),
    bookmarkedContracts: async (_, args) => await getBookmarkedContracts(args),
    getEntityList: async (_, args) => await getEntityList(args),
    getCapusaList: async (_, args) => await getCapusaList(args),
  },
  Mutation: {
    toggleBookmark: async (_, args, ctx) => await toggleBookmark(args, ctx),
    submitReport: async (_, args, ctx) => await submitReport(args, ctx),
    saveAlert: async (_, args, ctx) => await saveAlert(args, ctx),
  },
}

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})
