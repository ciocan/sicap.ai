import { Bucket, SearchItemDirect, SearchItemOffline, SearchItemPublic } from "./types";

export const ES_INDEX_PUBLIC = "licitatii-publice";
export const ES_INDEX_DIRECT = "achizitii-directe";
export const ES_INDEX_OFFLINE = "achizitii-offline";

export type Fields = Record<string, (string | number)[]>;

export const RESULTS_PER_PAGE = 20;

export function transformItem(index: string, fields: Fields, highlight: Fields) {
  switch (index) {
    case ES_INDEX_OFFLINE:
      return {
        date: fields["item.publicationDate"]?.[0],
        name: fields["item.contractObject"]?.[0],
        code: fields["item.noticeNo"]?.[0],
        cpvCode: fields["details.cpvCode.localeKey"]?.[0],
        cpvCodeAndName: fields["item.cpvCode"]?.[0],
        value: fields["item.awardedValue"]?.[0] || 0,
        supplierId: fields["details.noticeEntityAddress.fiscalNumber"]?.[0],
        supplierName: fields["item.supplier"]?.[0],
        localitySupplier: fields["details.noticeEntityAddress.city"]?.[0],
        countySupplier: fields["supplier.county"]?.[0], // TODO: add this field to the index
        contractingAuthorityId: fields["details.contractingAuthorityID"]?.[0],
        contractingAuthorityName: fields["item.contractingAuthority"]?.[0],
        localityAuthority: fields["authority.city"]?.[0], // TODO: add this field to the index
        countyAuthority: fields["authority.county"]?.[0], // TODO: add this field to the index
        state: fields["item.sysNoticeState.text"]?.[0],
        stateId: fields["item.sysNoticeState.id"]?.[0],
        type: fields["details.sysAcquisitionContractType.text"]?.[0],
        typeId: fields["details.sysAcquisitionContractType.id"]?.[0],
      } as SearchItemOffline;
    case ES_INDEX_DIRECT:
      return {
        date: fields["item.publicationDate"]?.[0],
        name: fields["item.directAcquisitionName"]?.[0],
        code: fields["item.uniqueIdentificationCode"]?.[0],
        cpvCode: fields["publicDirectAcquisition.cpvCode.localeKey"]?.[0],
        cpvCodeAndName: fields["item.cpvCode"]?.[0],
        value: fields["item.closingValue"]?.[0] || 0,
        supplierId: fields["publicDirectAcquisition.supplierId"]?.[0],
        supplierName: fields["item.supplier"]?.[0],
        localitySupplier: fields["supplier.city"]?.[0],
        countySupplier: fields["supplier.county"]?.[0],
        contractingAuthorityId: fields["publicDirectAcquisition.contractingAuthorityID"]?.[0],
        contractingAuthorityName: fields["item.contractingAuthority"]?.[0],
        localityAuthority: fields["authority.city"]?.[0],
        countyAuthority: fields["authority.county"]?.[0],
        state: fields["item.sysDirectAcquisitionState.text"]?.[0],
        stateId: fields["item.sysDirectAcquisitionState.id"]?.[0],
        type: fields["publicDirectAcquisition.sysAcquisitionContractType.text"]?.[0],
        typeId: fields["publicDirectAcquisition.sysAcquisitionContractType.id"]?.[0],
      } as SearchItemDirect;
    case ES_INDEX_PUBLIC:
      return {
        date: fields["item.noticeStateDate"]?.[0],
        name: fields["item.contractTitle"]?.[0],
        code: fields["item.noticeNo"]?.[0],
        cpvCode: fields["item.cpvCode"]?.[0],
        cpvCodeAndName: fields["item.cpvCodeAndName"]?.[0],
        value: fields["item.ronContractValue"]?.[0] || 0,
        supplierId: fields["noticeContracts.items.winner.entityId"]?.[0],
        supplierName: fields["noticeContracts.items.winner.name"]?.[0],
        supplierFiscalNumber: fields["noticeContracts.items.winner.fiscalNumber"]?.[0],
        localitySupplier: fields["noticeContracts.items.winner.address.city"]?.[0],
        countySupplier:
          fields["noticeContracts.items.winner.address.nutsCodeItem.text"]?.[0] ||
          fields["noticeContracts.items.winner.address.county.text"]?.[0],
        contractingAuthorityId: fields["publicNotice.entityId"]?.[0],
        contractingAuthorityName: fields["item.contractingAuthorityNameAndFN"]?.[0],
        localityAuthority:
          fields["publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.city"]?.[0] ||
          fields["publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.city"]?.[0],
        countyAuthority:
          fields[
            "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.nutsCodeItem.text"
          ]?.[0] ||
          fields[
            "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.county.text"
          ]?.[0] ||
          fields[
            "publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.nutsCodeItem.text"
          ]?.[0] ||
          fields[
            "publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.county.text"
          ]?.[0],
        state: fields["item.sysProcedureState.text"]?.[0],
        stateId: fields["item.sysProcedureState.id"]?.[0],
        type: fields["item.sysAcquisitionContractType.text"]?.[0],
        typeId: fields["item.sysAcquisitionContractType.id"]?.[0],
        procedureType: fields["item.sysProcedureType.text"]?.[0],
        procedureTypeId: fields["item.sysProcedureType.id"]?.[0],
        assigmentType: fields["item.sysContractAssigmentType.text"]?.[0],
        assigmentTypeId: fields["item.sysContractAssigmentType.id"]?.[0],
      } as SearchItemPublic;
    default:
      return undefined;
  }
}

export const fieldsAchizitii = [
  "item.directAcquisitionId",
  "item.directAcquisitionName",
  "item.sysDirectAcquisitionState.text",
  "item.sysDirectAcquisitionState.id",
  "item.uniqueIdentificationCode",
  "item.cpvCode",
  "item.publicationDate",
  "item.closingValue",
  "item.supplier",
  "item.contractingAuthority",
  "publicDirectAcquisition.cpvCode.*",
  "publicDirectAcquisition.supplierId",
  "publicDirectAcquisition.contractingAuthorityID",
  "publicDirectAcquisition.sysAcquisitionContractType.*",
  "publicDirectAcquisition.sysAcquisitionContractTypeID",
  "authority.city",
  "authority.county",
  "supplier.city",
  "supplier.county",
] as const;

export const fieldsAchizitiiOffline = [
  "item.contractId",
  "item.contractObject",
  "item.noticeNo",
  "item.publicationDate",
  "item.awardedValue",
  "item.supplier",
  "item.contractingAuthority",
  "item.sysNoticeState.*",
  "item.sysNoticeState.id",
  "item.sysAcquisitionContractType.*",
  "item.sysAcquisitionContractType.id",
  "details.cpvCode.*",
  "details.noticeEntityAddress.fiscalNumber",
  "details.noticeEntityAddress.city",
  "details.contractingAuthorityID",
  "authority.city",
  "authority.county",
  "supplier.city",
  "supplier.county",
] as const;

export const filedsLicitatii = [
  "item.caNoticeId",
  "item.noticeNo",
  "item.cpvCode",
  "item.cpvCodeAndName",
  "item.contractingAuthorityNameAndFN",
  "item.contractTitle",
  "item.ronContractValue",
  "item.sysAcquisitionContractType.*",
  "item.sysProcedureType.*",
  "item.sysContractAssigmentType.*",
  "item.sysNoticeState.*",
  "item.sysProcedureState.*",
  "item.cpvCodeAndName",
  "item.noticeStateDate",
  "publicNotice.entityId",
  "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.city",
  "publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.city",
  "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.county",
  "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.nutsCodeItem.text",
  "publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.county.text",
  "publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.nutsCodeItem.text",
  "noticeContracts.items.winner.name",
  "noticeContracts.items.winner.fiscalNumber",
  "noticeContracts.items.winner.fiscalNumberInt",
  "noticeContracts.items.winner.entityId",
  "noticeContracts.items.winner.address.city",
  "noticeContracts.items.winner.address.county.text",
  "noticeContracts.items.winner.address.nutsCodeItem.text",
  "noticeContracts.items.contractValue",
] as const;

export const mapBucket = (b: Bucket) => ({
  key: b.key_as_string,
  count: b.doc_count,
  value: b.sales.value,
});
