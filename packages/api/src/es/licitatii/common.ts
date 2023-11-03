export const noticeProps = [
  "caNoticeId",
  "noticeNo",
  "contractingAuthorityNameAndFN",
  "contractTitle",
  "ronContractValue",
  "sysAcquisitionContractType",
  "sysProcedureType",
  "sysContractAssigmentType",
  "sysNoticeState",
  "sysProcedureState",
  "cpvCodeAndName",
  "cpvCode",
  "noticeStateDate",
  "ronContractValue",
] as const;

export const noticeDetailsProps = ["title", "entityId"] as const;
export const caNoticeEdit_New = ["shortDescription"] as const;
export const caNoticeEdit_New__section1_New__section1_1__caAddress = [
  "cityItem",
  "city",
  "county",
] as const;
export const section2_2_New = ["descriptionList"] as const;

export const _source = [
  "item.caNoticeId",
  "item.noticeNo",
  "item.sysProcedureState",
  "item.contractingAuthorityNameAndFN",
  "item.contractTitle",
  "item.sysAcquisitionContractType",
  "item.sysProcedureType",
  "item.sysContractAssigmentType",
  "item.sysNoticeState",
  "item.cpvCodeAndName",
  "item.noticeStateDate",
  "item.ronContractValue",
  "publicNotice.entityId",
  "publicNotice.caNoticeEdit_New.section1_New.section1_1",
  "publicNotice.caNoticeEdit_New.section2_New.section2_1_New",
  "publicNotice.caNoticeEdit_New.section2_New.section2_2_New",
  "noticeContracts.items.winner",
  "noticeContracts.items.contractDate",
  "noticeContracts.items.contractValue",
] as const;
