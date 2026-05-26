import {
  getContractAchizitii,
  getContractAchizitiiOffline,
  getContractLicitatii,
} from "@sicap/api";
import type { ContractType } from "./format";

export function getContractByType(type: ContractType, id: string) {
  switch (type) {
    case "public":
      return getContractLicitatii(id);
    case "direct":
      return getContractAchizitii(id);
    case "offline":
      return getContractAchizitiiOffline(id);
  }
}
