import { ES_INDEX_DIRECT, ES_INDEX_PUBLIC } from "./config";
import { SearchItemDirect, SearchItemPublic } from "./types";

export function transformItem(index: string, fields: Record<string, (string | number)[]>) {
  switch (index) {
    case ES_INDEX_DIRECT:
      return {
        date: fields["item.publicationDate"]?.[0],
        name: fields["item.directAcquisitionName"]?.[0],
        code: fields["item.uniqueIdentificationCode"]?.[0],
        cpvCode: fields["item.cpvCode"]?.[0],
        cpvCodeId: fields["publicDirectAcquisition.cpvCode.id"]?.[0],
        value: fields["item.closingValue"]?.[0] || 0,
        supplierId: fields["publicDirectAcquisition.supplierId"]?.[0],
        supplierName: fields["item.supplier"]?.[0],
        contractingAuthorityId: fields["publicDirectAcquisition.contractingAuthorityID"]?.[0],
        contractingAuthorityName: fields["item.contractingAuthority"]?.[0],
        state: fields["item.sysDirectAcquisitionState.text"]?.[0],
        type: fields["publicDirectAcquisition.sysAcquisitionContractType.text"]?.[0],
      } as SearchItemDirect;
    case ES_INDEX_PUBLIC:
      return {
        date: fields["item.noticeStateDate"]?.[0],
        name: fields["item.contractTitle"]?.[0],
        code: fields["item.noticeNo"]?.[0],
        cpvCode: fields["item.cpvCodeAndName"]?.[0],
        cpvCodeId: fields["item.cpvCode"]?.[0],
        value: fields["noticeContracts.items.contractValue"]?.[0] || 0,
        supplierId: fields["noticeContracts.items.winner.entityId"]?.[0],
        supplierName: fields["noticeContracts.items.winner.name"]?.[0],
        supplierFiscalNumber: fields["noticeContracts.items.winner.fiscalNumber"]?.[0],
        contractingAuthorityId: fields["publicNotice.entityId"]?.[0],
        contractingAuthorityName: fields["item.contractingAuthorityNameAndFN"]?.[0],
        state: fields["item.sysProcedureState.text"]?.[0],
        type: fields["item.sysAcquisitionContractType.text"]?.[0],
        procedureType: fields["item.sysProcedureType.text"]?.[0],
        assigmentType: fields["item.sysContractAssigmentType.text"]?.[0],
      } as SearchItemPublic;
    default:
      return undefined;
  }
}
