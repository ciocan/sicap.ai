import { ExternalLink } from "lucide-react";

import { formatNumber } from "@/utils";
import { formatDate, getContractAchizitii } from "@sicap/api";
import { RowItem } from "./utils";
import Link from "next/link";

export async function ContractAchizitii({ id }: { id: string }) {
  const contract = await getContractAchizitii(id);
  const {
    closingValue,
    publicationDate,
    directAcquisitionName,
    directAcquisitionDescription,
    uniqueIdentificationCode,
    contractingAuthority,
    directAcquisitionItems,
    supplier,
    sysDirectAcquisitionState,
    sysAcquisitionContractType,
    cpvCode,
    istoric,
  } = contract;
  const { entityId, numericFiscalNumber, entityName, city, county } = contractingAuthority;

  const seapUrl = `https://www.${
    istoric ? "istoric." : ""
  }e-licitatie.ro/pub/direct-acquisition/view/${id}`;

  return (
    <div className="border dark:border-secondary p-4 rounded-sm">
      <div className="flex sm:flex-row flex-col justify-between gap-2">
        <h1 className="text-md font-semibold text-primary">{directAcquisitionName}</h1>
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
        <RowItem label="ID" value={uniqueIdentificationCode} />
        <RowItem label="Data" value={formatDate(publicationDate)} />
        <RowItem
          label="Valoare"
          value={
            <div className="font-semibold text-primary font-mono">
              {formatNumber(closingValue)} RON
            </div>
          }
        />
        <RowItem
          label="Stare"
          value={
            <span className={sysDirectAcquisitionState.id === 7 ? "" : "text-red-500"}>
              {sysDirectAcquisitionState.text}
            </span>
          }
        />
        <RowItem
          label="Autoritatea contractanta"
          value={
            <Link href={`/achizitii/autoritate/${entityId}`} className="hover:underline">
              {numericFiscalNumber} - {entityName}
            </Link>
          }
        />
        <RowItem label="Localitate" value={`${city}, ${county}`} />
        <RowItem
          label="Furnizor"
          value={
            <Link href={`/achizitii/firma/${supplier.entityId}`} className="hover:underline">
              {supplier.numericFiscalNumber} - {supplier.entityName}
            </Link>
          }
        />
        <RowItem label="Tipul contractului" value={sysAcquisitionContractType.text} />
        <RowItem label="Cod CPV" value={cpvCode} />
        <RowItem
          label="Descriere:"
          value={<samp className="text-xs">{directAcquisitionDescription}</samp>}
        />
        <RowItem
          label="Achizitii"
          value={
            <div>
              {directAcquisitionItems.map((item) => (
                <div
                  key={item.directAcquisitionItemID}
                  className="mb-2 border-b dark:border-b-gray-700 border-b-gray-100"
                >
                  <div className="text-primary font-mono">
                    {formatNumber(item.itemClosingPrice)} RON
                  </div>
                  <div className="mb-3">
                    <div className="text-gray-400">Cantitate: {item.itemQuantity}</div>
                    <div className="text-gray-400">Unitate masura: {item.itemMeasureUnit}</div>
                    <div className="text-md my-2">{item.catalogItemName}</div>
                    <samp className="text-xs">{item.catalogItemDescription}</samp>
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
