import { encode } from "@utils"

export const transformItem = (data) => {
  return {
    id: Number(data?.caNoticeId),
    authorityId:
      data?.entityId || encode(data?.contractingAuthorityNameAndFN || ""),
    code: data.noticeNo,
    title: data.contractTitle,
    value: data.ronContractValue || data.contractValue,
    authority: data.contractingAuthorityNameAndFN,
    cpvCode: data.cpvCodeAndName,
    date: data.noticeStateDate,
    contractType: data.sysAcquisitionContractType?.text,
    assigmentType: data.sysContractAssigmentType?.text,
    procedureType: data.sysProcedureType?.text,
    contractState: data.sysProcedureState,
    companyId: Number(data.winner?.entityId) || encode(data.winner?.name || ""),
    company: data.winner?.name
      ? `${data.winner?.fiscalNumber || ""} ${data.winner?.name}`
      : null,
  }
}

export const transformDirectItem = (data) => {
  return {
    id: data.directAcquisitionId,
    authorityId: data.contractingAuthority.entityId,
    code: data.uniqueIdentificationCode,
    title: data.directAcquisitionName,
    value: data.closingValue,
    authority: `${data.contractingAuthority.numericFiscalNumber} ${data.contractingAuthority.entityName}`,
    cpvCode: data.cpvCode,
    date: data.publicationDate,
    contractType: data.sysAcquisitionContractType?.text,
    contractState: data.sysDirectAcquisitionState,
    assigmentType: null,
    procedureType: null,
    companyId: data.supplier.entityId,
    company: `${data.supplier?.numericFiscalNumber || ""} ${
      data.supplier.entityName
    }`,
  }
}
