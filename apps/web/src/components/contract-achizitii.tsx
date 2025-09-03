import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { moneyRon } from "@/utils";
import { formatDate, getContractAchizitii } from "@sicap/api";
import { RowItem } from "./utils";

export async function ContractAchizitii({ id }: { id: string }) {
  let contract: Awaited<ReturnType<typeof getContractAchizitii>>;
  try {
    contract = await getContractAchizitii(id);
  } catch {
    return notFound();
  }

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
    cpvCodeAndName,
    cpvCode,
    istoric,
  } = contract;
  const { entityId, numericFiscalNumber, entityName, city, county } = contractingAuthority;

  const seapUrl = `https://${
    istoric ? "istoric." : ""
  }e-licitatie.ro/pub/direct-acquisition/view/${id}`;

  return (
    <div className="border dark:border-secondary p-4 rounded-sm">
      <div className="flex sm:flex-row flex-col justify-between gap-2">
        <h1 className="text-lg font-semibold">{directAcquisitionName}</h1>
        <a
          href={seapUrl}
          target="_blank"
          rel="noreferrer"
          className="hover:underline flex items-center gap-1 border-gray-200 dark:border-gray-500 border rounded-sm px-2 py-1 justify-center w-[90px] place-self-end text-primary"
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
          value={<div className="font-semibold font-mono">{moneyRon(closingValue)}</div>}
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
            <Link
              href={`/achizitii/autoritate/${entityId}`}
              className="underline text-primary font-semibold"
            >
              {numericFiscalNumber} - {entityName}
            </Link>
          }
        />
        <RowItem label="Localitate" value={`${city}, ${county}`} />
        <RowItem
          label="Furnizor"
          value={
            <Link
              href={`/achizitii/firma/${supplier.entityId}`}
              className="underline text-primary font-semibold"
            >
              {supplier.numericFiscalNumber} - {supplier.entityName}
            </Link>
          }
        />
        <RowItem label="Tipul contractului" value={sysAcquisitionContractType?.text || "-"} />
        <RowItem
          label="Cod CPV"
          value={
            <Link
              href={`/achizitii/cpv/${cpvCode}`}
              className="underline text-primary font-semibold"
            >
              {cpvCodeAndName}
            </Link>
          }
        />
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
                  <div className="font-semibold font-mono">{moneyRon(item.itemClosingPrice)}</div>
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
