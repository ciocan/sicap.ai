export interface RootObject {
  _source: Source;
}

export interface Source {
  item: Item;
  publicDirectAcquisition: PublicDirectAcquisition;
  authority: Authority;
  supplier: Supplier;
  istoric: boolean;
}

export interface CpvCode {
  id: number;
  text: string;
  localeKey: string;
}

export interface DirectAcquisitionItem {
  directAcquisitionItemID: number;
  catalogItemID: number;
  catalogItemHistoryID: number;
  sysCatalogItemStateID: number;
  catalogItemCode: string;
  catalogItemName: string;
  catalogItemDescription: string;
  catalogItemPrice: number;
  itemClosingPrice: number;
  itemEstimatedPrice: number;
  secondCurrencyEstimatedPrice: number;
  itemQuantity: number;
  itemRequestedQuantity: number;
  itemMeasureUnit: string;
  isRejectedBySupplier: boolean;
  hasQuantityCorrection: boolean;
  imageUrl: string | null;
  imageThumbUrl: string | null;
  associatedPaapDetailName: string | null;
  cpvCode: CpvCode;
  isExpired: boolean | null;
  itemHistory: string | null;
}

export interface SysAcquisitionContractType {
  id: number;
  text: string;
  localeKey: string;
}

export interface SysDirectAcquisitionState {
  id: number;
  text: string;
  localeKey: string;
}

export interface PublicDirectAcquisition {
  estimatedValue: number;
  secondCurrencyEstimatedValue: number;
  closingValue: number;
  secondCurrencyClosingValue: number;
  economyValue: number | null;
  economySecondCurrencyValue: number | null;
  economyPercent: number | null;
  lossValue: number | null;
  lossSecondCurrencyValue: number | null;
  lossPercent: number | null;
  publicationDate: string;
  supplierDecisionDate: string;
  caDecisionDate: string;
  finalizationDate: string;
  uniqueIdentificationCode: string;
  correctionReason: string | null;
  directAcquisitionID: number;
  directAcquisitionName: string;
  directAcquisitionDescription: string;
  cpvCode: CpvCode;
  deliveryCondition: string;
  paymentCondition: string;
  supplierId: number;
  supplierDecisionDeadline: string;
  caDecisionDeadline: string;
  contractingAuthorityID: number;
  directAcquisitionItems: DirectAcquisitionItem[];
  supplierRejectionReason: string | null;
  caRejectionReason: string | null;
  isOpenForCorrection: boolean | null;
  isOpenForContractCorrection: boolean;
  daAwardNoticeID: number | null;
  assignedSupplierUser: string | null;
  financingType: boolean;
  sysAcquisitionContractType: SysAcquisitionContractType;
  sysAcquisitionContractTypeID: number;
  sysEuropeanFund: string | null;
  sysEuropeanFundID: number | null;
  sysDirectAcquisitionState: SysDirectAcquisitionState;
  sysDirectAcquisitionStateID: number;
  isExpired: boolean | null;
}

export interface Authority {
  isUtility: boolean;
  entityId: number;
  numericFiscalNumber: string;
  fiscalNumber: string;
  entityName: string;
  city: string;
  county: string;
  country: string;
  postalCode: string | null;
  sysEntityTypeId: number | null;
}

export interface Supplier {
  countryId: number;
  cityItem: string | null;
  entityId: number;
  numericFiscalNumber: string;
  fiscalNumber: string;
  entityName: string;
  city: string;
  county: string;
  country: string;
  postalCode: string;
  sysEntityTypeId: number | null;
}

export interface Item {
  directAcquisitionId: number;
  directAcquisitionName: string;
  sysDirectAcquisitionState: SysDirectAcquisitionState;
  uniqueIdentificationCode: string;
  cpvCode: string;
  publicationDate: string;
  finalizationDate: string;
  caDecisionDeadline: string;
  supplierDecisionDeadline: string;
  supplier: string;
  contractingAuthority: string;
  estimatedValueRon: number;
  estimatedValueOtherCurrency: number;
  closingValue: number;
  isOpenForCorrection: boolean | null;
  isOpenForContractCorrection: boolean;
}
