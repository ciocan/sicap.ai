import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { moneyRon } from "@/utils";
import { formatDateTime, getContractAchizitiiOffline } from "@sicap/api";
import { RowItem } from "./utils";

export async function ContractAchizitiiOffline({ id }: { id: string }) {
  const contract = await getContractAchizitiiOffline(id);
  const {
    awardedValue,
    publicationDate,
    finalizationDate,
    contractDate,
    contractObject,
    noticeNo,
    contractingAuthority,
    directAcquisitions,
    sysAcquisitionContractType,
    supplier,
    sysNoticeState,
    cpvCodeAndName,
    cpvCode,
    cpvCategory,
    acquisitionType,
    noticeEntityAddress,
  } = contract;
  const {
    entityId,
    numericFiscalNumber,
    entityName,
    city: cityAuthority,
    county,
  } = contractingAuthority;
  const {
    country: countrySupplier,
    city: citySupplier,
    organization,
    fiscalNumber,
  } = noticeEntityAddress;

  const istoric = Number(id) < 100_000_000 ? true : false;
  const seapUrl = `https://${
    istoric ? "istoric." : ""
  }e-licitatie.ro/pub/direct-acquisition/award-notice/view/${id}`;

  const supplierId = supplier.entityId || `${fiscalNumber}?isFiscal=true`;
  const supplierName = supplier.entityId
    ? `${supplier.numericFiscalNumber} - ${supplier.entityName}`
    : `${fiscalNumber} - ${organization}`;

  return (
    <div className="border dark:border-secondary p-4 rounded-sm">
      <div className="flex sm:flex-row flex-col justify-between gap-2">
        <h1 className="text-md font-semibold text-primary">{contractObject}</h1>
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
        <RowItem label="Data publicare" value={formatDateTime(publicationDate)} />
        <RowItem label="Data finalizare" value={formatDateTime(finalizationDate)} />
        <RowItem label="Data contract" value={formatDateTime(contractDate)} />
        <RowItem
          label="Valoare"
          value={
            <div className="font-semibold text-primary font-mono">{moneyRon(awardedValue)}</div>
          }
        />
        <RowItem
          label="Stare"
          value={
            <span className={sysNoticeState.id === 2 ? "" : "text-red-500"}>
              {sysNoticeState.text}
            </span>
          }
        />
        <RowItem label="Modalitate de desfasurare" value={<span>{acquisitionType}</span>} />
        <RowItem label="Tipul contractului" value={sysAcquisitionContractType.text} />
        <RowItem
          label="Cod CPV"
          value={
            <Link href={`/achizitii-offline/cpv/${cpvCode}`} className="hover:underline underline">
              {cpvCodeAndName}
            </Link>
          }
        />
        <RowItem label="Categorie CPV" value={cpvCategory} />
        <RowItem
          label="Autoritatea contractanta"
          className="text-primary"
          value={
            <Link
              href={`/achizitii-offline/autoritate/${entityId}`}
              className="hover:underline underline"
            >
              {numericFiscalNumber} - {entityName}
            </Link>
          }
        />
        <RowItem label="Localitate" value={`${cityAuthority}, ${county}`} />
        <RowItem
          label="Ofertant"
          className="text-primary"
          value={
            <Link
              href={`/achizitii-offline/firma/${supplierId}`}
              className="hover:underline underline"
            >
              {supplierName}
            </Link>
          }
        />
        <RowItem label="Localitate" value={`${citySupplier}, ${countrySupplier.text}`} />
        <RowItem
          label="Achizitii"
          value={
            <div>
              {directAcquisitions.map((item) => (
                <div
                  key={item.directAcquisitionID}
                  className="mb-2 border-b dark:border-b-gray-700 border-b-gray-100"
                >
                  <div className="text-primary font-mono">{moneyRon(item.closingValue)}</div>
                  <div className="mb-3">
                    <div className="text-md my-2">{item.directAcquisitionName}</div>
                  </div>
                </div>
              ))}
              {directAcquisitions.length === 0 && <div className="text-sm">-</div>}
            </div>
          }
        />
      </div>
    </div>
  );
}
