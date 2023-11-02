export const itemProps = [
  "directAcquisitionId",
  "directAcquisitionName",
  "sysDirectAcquisitionState",
  "uniqueIdentificationCode",
  "cpvCode",
  "publicationDate",
  "closingValue",
] as const;

export const publicDirectAcquisitionProps = [
  "directAcquisitionDescription",
  "sysAcquisitionContractType",
  "directAcquisitionItems",
] as const;

export const supplierProps = [
  "entityId",
  "numericFiscalNumber",
  "entityName",
  "city",
  "county",
] as const;

export const authorityProps = [
  "entityId",
  "numericFiscalNumber",
  "entityName",
  "city",
  "county",
] as const;
