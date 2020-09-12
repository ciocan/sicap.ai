import gql from "graphql-tag"

export const ME = gql`
  {
    me {
      id
      bookmarks {
        contractId
        db
      }
      reports {
        db
        contractId
        confidence
        comment
        createdAt
      }
    }
  }
`

export const TOTAL = gql`
  {
    total {
      licitatii
      achizitii
    }
  }
`

export const SAVE_ALERT = gql`
  mutation saveAlert($cui: [String!]!) {
    saveAlert(cui: $cui)
  }
`

export const GET_ALERTS = gql`
  {
    alerts
  }
`

export const TOGGLE_BOOKMARK = gql`
  mutation toggleBookmark($contractId: Int!, $db: String!) {
    toggleBookmark(contractId: $contractId, db: $db) {
      contractId
      db
    }
  }
`

export const BOOKMARKS = gql`
  {
    bookmarks {
      contractId
      db
    }
  }
`

export const SUBMIT_REPORT = gql`
  mutation submitReport(
    $contractId: Int!
    $confidence: Int!
    $comment: String!
    $db: String!
  ) {
    submitReport(
      contractId: $contractId
      confidence: $confidence
      comment: $comment
      db: $db
    ) {
      id
    }
  }
`

export const GET_REPORTS = gql`
  {
    getReports {
      db
      contractId
      confidence
      comment
      createdAt
    }
  }
`

const contractDetailsFragment = gql`
  fragment ContractDetails on Contract {
    noticeNo
    entityId
    caNoticeId
    sysAcquisitionContractType {
      text
    }
    sysProcedureType {
      id
      text
    }
    sysContractAssigmentType {
      text
    }
    sysProcedureState {
      id
      text
    }
    sysNoticeState {
      id
      text
    }
    contractTitle
    ronContractValue
    contractValue
    contractingAuthorityNameAndFN
    cpvCodeAndName
    noticeStateDate
    contractDate
    city
    cityItem {
      text
    }
    county {
      text
    }
    descriptionList {
      lotNumber
      contractTitle
      mainLocation
      shortDescription
      estimatedValue
      lotInfo
    }
    winner {
      entityId
      name
      fiscalNumber
      fiscalNumberInt
    }
    winners {
      entityId
      name
      fiscalNumber
      fiscalNumberInt
    }
    istoric
  }
`

export const CONTRACTS = gql`
  query contracts($query: String!, $page: Int) {
    contracts(query: $query, page: $page) {
      ms
      hits
      list {
        ...ContractDetails
      }
    }
    ${contractDetailsFragment}
  }
`

export const CONTRACT = gql`
  query contract($id: String!) {
    contract(id: $id) {
      ms
      ...ContractDetails
      title
      shortDescription
    }
    ${contractDetailsFragment}
  }
`

export const COMPANY = gql`
  query company($company: String!, $page: Int) {
    company(company: $company, page: $page) {
      hits
      winner {
        name
        fiscalNumber
        address {
          address
          postalCode
          city
          county {
            localeKey
            text
          }
        }
      }
      stats {
        years {
          key
          count
          value
        }
        months {
          key
          count
          value
        }
      }
      list {
        ...ContractDetails
      }
    }
    ${contractDetailsFragment}
  }
`

export const AUTHORITY = gql`
  query company($authority: String!, $page: Int) {
    company(authority: $authority, page: $page) {
      hits
      caAddress {
        contractingAuthorityNameAndFN
        nationalIDNumber
        officialName
        address
        city
        postalCode
        nutsCodeItem {
          text
        }
      }
      stats {
        years {
          key
          count
          value
        }
        months {
          key
          count
          value
        }
      }
      list {
        ...ContractDetails
      }
    }
    ${contractDetailsFragment}
  }
`

const directContractDetailsFragment = gql`
  fragment DirectContractDetails on DirectContract {
    directAcquisitionId
    directAcquisitionName
    sysDirectAcquisitionState {
      id
      text
    }
    uniqueIdentificationCode
    cpvCode
    publicationDate
    supplier {
      entityId
      numericFiscalNumber
      entityName
      city
      county
    }
    contractingAuthority {
      entityId
      numericFiscalNumber
      entityName
      city
      county
    }
    closingValue
    directAcquisitionDescription
    directAcquisitionItems {
      directAcquisitionItemID
      catalogItemName
      catalogItemDescription
      itemClosingPrice
      itemQuantity
      itemMeasureUnit
      cpvCode
    }
    sysAcquisitionContractType {
      text
    }
    istoric
  }
`

const directContractDetailsSearchFragment = gql`
  fragment DirectContractDetailsSearch on DirectContract {
    directAcquisitionId
    directAcquisitionName
    sysDirectAcquisitionState {
      id
      text
    }
    uniqueIdentificationCode
    cpvCode
    publicationDate
    supplier {
      entityId
      numericFiscalNumber
      entityName
    }
    contractingAuthority {
      entityId
      numericFiscalNumber
      entityName
    }
    closingValue
    sysAcquisitionContractType {
      text
    }
  }
`

export const DIRECT_CONTRACTS = gql`
  query directContracts($query: String!, $page: Int) {
    directContracts(query: $query, page: $page) {
      ms
      hits
      list {
        ...DirectContractDetailsSearch
      }
    }
    ${directContractDetailsSearchFragment}
  }
`

export const DIRECT_AUTHORITY = gql`
  query directCompany($authority: String!, $page: Int) {
    directCompany(authority: $authority, page: $page) {
      hits
      contractingAuthority {
        entityId
        numericFiscalNumber
        entityName
        city
        county
      }
      stats {
        years {
          key
          count
          value
        }
        months {
          key
          count
          value
        }
      }
      list {
        ...DirectContractDetailsSearch
      }
    }
    ${directContractDetailsSearchFragment}
  }
`

export const DIRECT_COMPANY = gql`
  query directCompany($company: String!, $page: Int) {
    directCompany(company: $company, page: $page) {
      hits
      supplier {
        entityId
        numericFiscalNumber
        entityName
        city
        county
      }
      stats {
        years {
          key
          count
          value
        }
        months {
          key
          count
          value
        }
      }
      list {
        ...DirectContractDetailsSearch
      }
    }
    ${directContractDetailsSearchFragment}
  }
`

export const DIRECT_CONTRACT = gql`
  query directContract($id: String!) {
    directContract(id: $id) {
      ms
      ...DirectContractDetails
    }
    ${directContractDetailsFragment}
  }
`

export const BOOKMARKED_CONTRACTS_L = gql`
  query bookmarkedContracts($bookmarks: [Int!], $page: Int, $db: String) {
    bookmarkedContracts(bookmarks: $bookmarks, page: $page, db: $db) {
      ... on Contracts {
        ms
        hits
        list {
          ...ContractDetails
        }
      }
    }
    ${contractDetailsFragment}
  }
`

export const BOOKMARKED_CONTRACTS_A = gql`
  query bookmarkedContracts($bookmarks: [Int!], $page: Int, $db: String) {
    bookmarkedContracts(bookmarks: $bookmarks, page: $page, db: $db) {
      ... on DirectContracts {
        ms
        hits
        list {
          ...DirectContractDetailsSearch
        }
      }
    }
    ${directContractDetailsSearchFragment}
  }
`

export const STATS = gql`
  query getEntityList($db: String!, $stat: String!, $start: Int, $end: Int) {
    getEntityList(db: $db, stat: $stat, start: $start, end: $end) {
      key
      count
      value
      entityId
    }
  }
`

export const CAPUSA = gql`
  query getCapusaList($db: String!, $page: Int, $filter: String) {
    getCapusaList(db: $db, page: $page, filter: $filter) {
      total
      value
      list {
        entityId
        entityName
        fiscalNumber
        city
        county
        stats {
          contracts
          employees
          value
          data {
            label
            data {
              primary
              secondary
            }
          }
        }
      }
    }
  }
`
