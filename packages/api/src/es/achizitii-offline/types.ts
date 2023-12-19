import { Authority, CpvCode, Supplier } from "../achizitii/types";

export interface RootObject {
  _source: Source;
}

export interface Source {
  item: Item;
  details: Details;
  authority: Authority;
  supplier: Supplier;
}

export interface Item {
  daAwardNoticeId: number;
  contractObject: string;
  noticeNo: string;
  sysNoticeState: SysNoticeState;
  supplier: string;
  contractingAuthority: string;
  cpvCode: string;
  cpvCategory: string;
  publicationDate: string;
  awardedValue: number;
}

export interface SysNoticeState {
  id: number;
  text: string;
  localeKey: null | string;
}

export interface Details {
  sysNoticeState: SysNoticeState;
  sysNoticeStateID: number;
  noticeNo: string;
  secondCurrencyAwardedValue: null | number;
  publicationDate: string;
  acquisitionType: string;
  contractingAuthorityID: number;
  history: null | string;
  daAwardNoticeID: number;
  isOnlineAcquisition: boolean;
  noticeEntityAddress: NoticeEntityAddress;
  contractObject: string;
  awardedValue: number;
  cpvCode: CpvCode;
  contractDate: string;
  finalizationDate: string;
  financingType: null | string;
  assignedUserID: null | number;
  supplierID: number;
  directAcquisitions: DirectAcquisition[];
  cpvForCombo: string;
  sysAcquisitionContractType: SysAcquisitionContractType;
  sysAcquisitionContractTypeID: number;
  sysDirectAcqDocType: SysDirectAcqDocType;
  sysDirectAcqDocTypeID: number;
  sysEuropeanFund: null | string;
  sysEuropeanFundId: null | number;
}

export interface NoticeEntityAddress {
  noticeEntityAddressID: number;
  organization: string;
  postalAddress: string;
  fiscalNumber: string;
  city: string;
  cityItem: null | string;
  postalCode: string;
  contactPoints: null | string;
  attentionTo: null | string;
  phone: string;
  fax: string;
  email: string;
  url: null | string;
  urlBuyerProfile: null | string;
  country: Country;
  sysNoticeEntityAddressType: SysNoticeEntityAddressType;
}

export interface Country {
  id: number;
  text: string;
  localeKey: string;
}

export interface SysNoticeEntityAddressType {
  id: number;
  text: string;
  localeKey: string;
}

export interface DirectAcquisition {
  directAcquisitionID: number;
  uniqueIdentificationCode: string;
  directAcquisitionName: string;
  finalizationDate: string;
  closingValue: number;
  supplier: DirectAcquisitionSupplier;
  supplierFiscalCode: string;
  daAwardNoticeID: number;
  sysAcquisitionContractTypeID: null | number;
  cpvCode: CpvCode;
  awardNoticeChecked: boolean;
  sysEuropeanFundID: null | number;
}

export interface DirectAcquisitionSupplier {
  id: number;
  text: string;
  localeKey: string;
}

export interface SysAcquisitionContractType {
  id: number;
  text: string;
  localeKey: null | string;
}

export interface SysDirectAcqDocType {
  id: number;
  text: string;
  localeKey: null | string;
}
