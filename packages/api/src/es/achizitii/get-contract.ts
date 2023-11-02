import { pick } from "ramda";

import { esClient } from "../config";
import { ES_INDEX_DIRECT } from "../utils";
import { RootObject } from "./types";

export async function getContractAchizitii(id: string) {
  const result = await esClient.search({
    index: ES_INDEX_DIRECT,
    body: {
      query: {
        match: {
          _id: id,
        },
      },
    },
  });

  const [contract] = result.hits.hits as RootObject[];

  if (!contract) {
    throw new Error(`Contractul nu a fostgasit: ${id}`);
  }

  const data = {
    ...pick(["istoric"], contract._source),
    ...pick(
      [
        "directAcquisitionId",
        "directAcquisitionName",
        "sysDirectAcquisitionState",
        "uniqueIdentificationCode",
        "cpvCode",
        "publicationDate",
        "closingValue",
      ],
      contract._source.item,
    ),
    ...pick(
      ["directAcquisitionDescription", "sysAcquisitionContractType", "directAcquisitionItems"],
      contract._source.publicDirectAcquisition,
    ),
    supplier: {
      ...pick(
        ["entityId", "numericFiscalNumber", "entityName", "city", "county"],
        contract._source.supplier,
      ),
    },
    contractingAuthority: {
      ...pick(
        ["entityId", "numericFiscalNumber", "entityName", "city", "county"],
        contract._source.authority,
      ),
    },
  };

  return data;
}
