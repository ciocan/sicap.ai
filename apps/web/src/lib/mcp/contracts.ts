import {
  getContractAchizitii,
  getContractAchizitiiOffline,
  getContractLicitatii,
} from "@sicap/api";
import type { ContractSlug } from "./format";

export function getContractBySlug(slug: ContractSlug, id: string) {
  switch (slug) {
    case "licitatii":
      return getContractLicitatii(id);
    case "achizitii":
      return getContractAchizitii(id);
    case "achizitii-offline":
      return getContractAchizitiiOffline(id);
  }
}
