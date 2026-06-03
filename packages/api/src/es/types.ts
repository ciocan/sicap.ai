import type { ES_INDEX_DIRECT, ES_INDEX_OFFLINE, ES_INDEX_PUBLIC } from "./utils";

export type IndexName = typeof ES_INDEX_PUBLIC | typeof ES_INDEX_DIRECT | typeof ES_INDEX_OFFLINE;

export interface SearchStatusSelection {
  index: IndexName;
  stateId: number;
}

export interface SearchStatusOption extends SearchStatusSelection {
  label: string;
  token: string;
}

export interface SearchFilters {
  db?: IndexName[];
  dateFrom?: string;
  dateTo?: string;
  valueFrom?: string;
  valueTo?: string;
  authority?: string;
  cpv?: string;
  localityAuthority?: string;
  countyAuthority?: string;
  supplier?: string;
  localitySupplier?: string;
  countySupplier?: string;
  euFunds?: boolean;
  status?: SearchStatusSelection[];
}
export interface SearchProps {
  query: string;
  page?: number;
  perPage?: number;
  filters: SearchFilters;
}

export interface SearchItemDirect {
  date: string;
  name: string;
  code: string;
  cpvCode: string;
  cpvCodeAndName: string;
  value: string;
  supplierId: string;
  supplierName: string;
  supplierFiscalNumber: string;
  localitySupplier: string;
  countySupplier: string;
  contractingAuthorityId: string;
  contractingAuthorityName: string;
  authorityFiscalNumber: string;
  localityAuthority: string;
  countyAuthority: string;
  state: string;
  stateId: number;
  type: string;
  typeId: number;
  euFunds: string;
}

export interface SearchItemPublic extends SearchItemDirect {
  procedureType: string;
  procedureTypeId: string;
  assigmentType: string;
  assigmentTypeId: string;
  // Total distinct winners on the contract. >1 means the contract is shared
  // (multi-lot or consortium) and the supplier shown is one of several.
  winnersCount?: number;
  // Sum of contractValue across lots where the viewed company is the primary
  // winner. Only set when a supplier context is provided AND at least one lot
  // matched; undefined for co-winner-only matches where allocation is unknown.
  awardedValue?: number;
}

export interface SearchItemOffline extends SearchItemDirect {}

export interface Bucket {
  key_as_string: string;
  doc_count: number;
  sales: {
    value: number;
  };
}

export interface Buckets {
  buckets: Bucket[];
}

export interface Args {
  authorityId?: string;
  supplierId?: string;
  cpvCode?: string;
  page?: number;
  perPage?: number;
  isFiscal?: string;
}
