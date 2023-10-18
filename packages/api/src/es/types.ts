import { ES_INDEX_DIRECT, ES_INDEX_PUBLIC } from "./config";

export type IndexName = typeof ES_INDEX_PUBLIC | typeof ES_INDEX_DIRECT;

export interface SearchProps {
  query: string;
  page?: number;
  perPage?: number;
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
  contractingAuthorityId: string;
  contractingAuthorityName: string;
  state: string;
  type: string;
}

export interface SearchItemPublic extends SearchItemDirect {
  procedureType: string;
  assigmentType: string;
  supplierFiscalNumber: string;
}
