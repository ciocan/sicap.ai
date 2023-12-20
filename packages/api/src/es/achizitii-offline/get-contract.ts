import { pick } from "ramda";

import { esClient } from "../config";
import { ES_INDEX_OFFLINE } from "../utils";
import { RootObject } from "./types";
import { authorityProps, itemProps, detailsProps, supplierProps } from "./common";

export async function getContractAchizitiiOffline(id: string) {
  const result = await esClient.search({
    index: ES_INDEX_OFFLINE,
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
    throw new Error(`Contractul nu a fost gasit: ${id}`);
  }

  const data = {
    ...pick(itemProps, contract._source.item),
    ...pick(detailsProps, contract._source.details),
    cpvCode: contract._source.details.cpvCode.localeKey,
    cpvCodeAndName: contract._source.item.cpvCode,
    supplier: {
      ...pick(supplierProps, contract._source.supplier || []),
    },
    contractingAuthority: {
      ...pick(authorityProps, contract._source.authority),
    },
  };

  return data;
}
