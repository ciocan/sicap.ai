import { ExternalLink } from "lucide-react";

import { formatNumber } from "@/utils";
import { formatDate, getContractLicitatii } from "@sicap/api";
import { RowItem } from "./utils";
import Link from "next/link";

export async function ContractLicitatii({ id }: { id: string }) {
  const contract = await getContractLicitatii(id);
  const {
    noticeNo,
    contractTitle,
    city,
    county,
    contractingAuthorityNameAndFN,
    sysProcedureState,
    sysProcedureType,
    sysAcquisitionContractType,
    contractValue,
    contractDate,
    cpvCodeAndName,
    shortDescription,
    descriptionList,
    winner,
    istoric,
  } = contract;

  const seapUrl = `https://${
    istoric ? "istoric." : ""
  }e-licitatie.ro/pub/notices/ca-notices/view-c/${id}`;

  return (
    <div className="border dark:border-secondary p-4 rounded-sm">
      <div className="flex sm:flex-row flex-col justify-between gap-2">
        <h1 className="text-md font-semibold text-primary">{contractTitle}</h1>
        <a
          href={seapUrl}
          target="_blank"
          rel="noreferrer"
          className="hover:underline flex items-center gap-1 border-gray-200 dark:border-gray-500 border rounded-sm px-2 py-1 justify-center w-[90px] place-self-end"
        >
          <span>SEAP</span>
          <ExternalLink className="w-[1rem]" />
        </a>
      </div>
      <div className="grid sm:grid-cols-[25%,75%] mt-4">
        <RowItem label="ID" value={noticeNo} />
        <RowItem label="Data" value={formatDate(contractDate)} />
        <RowItem
          label="Valoare"
          value={
            <div className="font-semibold text-primary font-mono">
              {formatNumber(contractValue)} RON
            </div>
          }
        />
        <RowItem
          label="Stare"
          value={
            <span className={sysProcedureState.id === 5 ? "" : "text-red-500"}>
              {sysProcedureState.text}
            </span>
          }
        />
        <RowItem label="Tip procedura:" value={sysProcedureType.text} />
        <RowItem label="Tipul contractului::" value={sysAcquisitionContractType.text} />
        <RowItem
          label="Autoritatea contractanta"
          value={
            <Link href={`/licitatii/autoritate/${winner.entityId}`} className="hover:underline">
              {contractingAuthorityNameAndFN}
            </Link>
          }
        />
        <RowItem label="Localitate" value={`${city} ${county ? `, ${county}` : ""}`} />
        <RowItem
          label="Furnizor"
          value={
            <Link href={`/licitatii/firma/${winner.entityId}`} className="hover:underline">
              {winner.fiscalNumber} - {winner.name}
            </Link>
          }
        />
        <RowItem label="Cod CPV" value={cpvCodeAndName} />
        <RowItem label="Descriere:" value={<samp className="text-xs">{shortDescription}</samp>} />
        <RowItem
          label="Loturi:"
          value={
            <div>
              {descriptionList.map((item) => (
                <div
                  key={item.lotNumber}
                  className="mb-2 border-b dark:border-b-gray-700 border-b-gray-100"
                >
                  {item.estimatedValue && (
                    <div className="text-primary font-mono">
                      {formatNumber(item.estimatedValue)} RON
                    </div>
                  )}
                  <div className="mb-3">
                    <div className="text-gray-400">{item.mainLocation}</div>
                    <div className="text-gray-400">{item.contractTitle}</div>
                    <samp className="text-xs">{item.shortDescription}</samp>
                  </div>
                </div>
              ))}
            </div>
          }
        />
      </div>
    </div>
  );
}
