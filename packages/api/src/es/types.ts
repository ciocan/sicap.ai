import { ES_INDEX_DIRECT, ES_INDEX_PUBLIC } from "./utils";

export type IndexName = typeof ES_INDEX_PUBLIC | typeof ES_INDEX_DIRECT;

export interface SearchFilters {
  db?: IndexName[];
  dateFrom?: string;
  dateTo?: string;
  valueFrom?: string;
  valueTo?: string;
  authority?: string;
  cpv?: string;
  localityAuthority?: string;
  supplier?: string;
  localitySupplier?: string;
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
  cpvCodeId: string;
  value: string;
  supplierId: string;
  supplierName: string;
  localitySupplier: string;
  contractingAuthorityId: string;
  contractingAuthorityName: string;
  localityAuthority: string;
  state: string;
  type: string;
}

export interface SearchItemPublic extends SearchItemDirect {
  procedureType: string;
  assigmentType: string;
  supplierFiscalNumber: string;
}
