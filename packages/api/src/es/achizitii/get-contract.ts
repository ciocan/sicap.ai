import { pick } from "ramda";

import { esClient } from "../config";
import { ES_INDEX_DIRECT } from "../utils";
import { RootObject } from "./types";
import { authorityProps, itemProps, publicDirectAcquisitionProps, supplierProps } from "./common";

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
    ...pick(itemProps, contract._source.item),
    ...pick(publicDirectAcquisitionProps, contract._source.publicDirectAcquisition),
    cpvCode: contract._source.publicDirectAcquisition.cpvCode.localeKey,
    cpvCodeAndName: contract._source.item.cpvCode,
    supplier: {
      ...pick(supplierProps, contract._source.supplier),
    },
    contractingAuthority: {
      ...pick(authorityProps, contract._source.authority),
    },
  };

  return data;
}
