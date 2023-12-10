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
  countyAuthority?: string;
  supplier?: string;
  localitySupplier?: string;
  countySupplier?: string;
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
  localitySupplier: string;
  countySupplier: string;
  contractingAuthorityId: string;
  contractingAuthorityName: string;
  localityAuthority: string;
  countyAuthority: string;
  state: string;
  stateId: number;
  type: string;
  typeId: number;
}

export interface SearchItemPublic extends SearchItemDirect {
  procedureType: string;
  procedureTypeId: string;
  assigmentType: string;
  assigmentTypeId: string;
  supplierFiscalNumber: string;
}

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
}
