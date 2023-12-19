export const itemProps = [
  "daAwardNoticeId",
  "contractObject",
  "sysNoticeState",
  "noticeNo",
  "publicationDate",
  "awardedValue",
  "contractingAuthority",
  "supplier",
  "cpvCategory",
] as const;

export const detailsProps = [
  "sysNoticeState",
  "acquisitionType",
  "contractingAuthorityID",
  "sysAcquisitionContractType",
  "isOnlineAcquisition",
  "noticeEntityAddress",
  "cpvCode",
  "supplierID",
  "directAcquisitions",
  "finalizationDate",
  "contractDate",
] as const;

export const supplierProps = [
  "entityId",
  "numericFiscalNumber",
  "entityName",
  "city",
  "county",
] as const;

export const authorityProps = [
  "entityId",
  "numericFiscalNumber",
  "entityName",
  "city",
  "county",
] as const;
