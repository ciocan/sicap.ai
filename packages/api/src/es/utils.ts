import type { Bucket, SearchItemDirect, SearchItemOffline, SearchItemPublic } from "./types";

export const ES_INDEX_PUBLIC = process.env.NEXT_PUBLIC_ES_INDEX_PUBLIC as string;
export const ES_INDEX_DIRECT = process.env.NEXT_PUBLIC_ES_INDEX_DIRECT as string;
export const ES_INDEX_OFFLINE = process.env.NEXT_PUBLIC_ES_INDEX_OFFLINE as string;

// ONRC trade-registry + MFP financials enrichment indices. Same names across envs
// (full prod-scale data, no -test variant), so they default to the literal index names.
export const ES_INDEX_ONRC = process.env.ES_INDEX_ONRC || "onrc";
export const ES_INDEX_ONRC_FINANCIALS = process.env.ES_INDEX_ONRC_FINANCIALS || "onrc_financials";

export const ES_INDICES = [ES_INDEX_PUBLIC, ES_INDEX_DIRECT, ES_INDEX_OFFLINE] as const;
export type ES_INDICES_TYPE = (typeof ES_INDICES)[number];

export type Fields = Record<string, (string | number)[]>;

export const RESULTS_PER_PAGE = 20;

export type TransformItemContext = {
  // When the caller is viewing a specific company (e.g. /firma/[nationalId]),
  // pass its fiscal number / entityId so multi-winner licitatii pick the
  // matching winner from noticeContracts.items[].winners[] instead of the
  // first one ES happens to return.
  supplierFiscalNumber?: string;
  supplierEntityId?: string | number;
};

const findMatchingWinnerIndex = (
  fields: Fields,
  ctx: TransformItemContext | undefined,
): { prefix: "winner" | "winners"; idx: number } => {
  if (!ctx) {
    return { prefix: "winner", idx: 0 };
  }
  const fiscal = ctx.supplierFiscalNumber?.toString();
  const entityId = ctx.supplierEntityId?.toString();

  const matches = (val: string | number | undefined) => {
    if (val === undefined) {
      return false;
    }
    const s = val.toString();
    return (fiscal !== undefined && s === fiscal) || (entityId !== undefined && s === entityId);
  };

  const winnerFiscalNumbers = fields["noticeContracts.items.winner.fiscalNumberInt"] || [];
  const winnerEntityIds = fields["noticeContracts.items.winner.entityId"] || [];
  const winnerLen = Math.max(winnerFiscalNumbers.length, winnerEntityIds.length);
  for (let i = 0; i < winnerLen; i++) {
    if (matches(winnerFiscalNumbers[i]) || matches(winnerEntityIds[i])) {
      return { prefix: "winner", idx: i };
    }
  }

  const winnersFiscalNumbers = fields["noticeContracts.items.winners.fiscalNumberInt"] || [];
  const winnersEntityIds = fields["noticeContracts.items.winners.entityId"] || [];
  const winnersLen = Math.max(winnersFiscalNumbers.length, winnersEntityIds.length);
  for (let i = 0; i < winnersLen; i++) {
    if (matches(winnersFiscalNumbers[i]) || matches(winnersEntityIds[i])) {
      return { prefix: "winners", idx: i };
    }
  }

  return { prefix: "winner", idx: 0 };
};

export function transformItem(
  index: string,
  fields: Fields,
  _highlight: Fields,
  ctx?: TransformItemContext,
): SearchItemDirect | SearchItemPublic | SearchItemOffline {
  switch (index) {
    case ES_INDEX_OFFLINE:
      return {
        date: fields["item.publicationDate"]?.[0],
        name: fields["item.contractObject"]?.[0],
        code: fields["item.noticeNo"]?.[0],
        cpvCode: fields["details.cpvCode.localeKey"]?.[0],
        cpvCodeAndName: fields["item.cpvCode"]?.[0],
        value: fields["item.awardedValue"]?.[0] || 0,
        supplierId:
          fields["supplier.entityId"]?.[0] ||
          `${fields["details.noticeEntityAddress.fiscalNumber"]?.[0]}?isFiscal=true`,
        supplierName: fields["item.supplier"]?.[0],
        supplierFiscalNumber: fields["details.noticeEntityAddress.fiscalNumber"]?.[0],
        localitySupplier: fields["details.noticeEntityAddress.city"]?.[0],
        countrySupplier: fields["details.noticeEntityAddress.country.text"]?.[0],
        countySupplier: fields["supplier.county"]?.[0],
        contractingAuthorityId: fields["details.contractingAuthorityID"]?.[0],
        contractingAuthorityName: fields["item.contractingAuthority"]?.[0],
        authorityFiscalNumber: fields["authority.numericFiscalNumber"]?.[0],
        localityAuthority: fields["authority.city"]?.[0],
        countyAuthority: fields["authority.county"]?.[0],
        state: fields["item.sysNoticeState.text"]?.[0],
        stateId: fields["item.sysNoticeState.id"]?.[0],
        type: fields["details.sysAcquisitionContractType.text"]?.[0],
        typeId: fields["details.sysAcquisitionContractType.id"]?.[0],
        euFunds: fields["details.sysEuropeanFund.text"]?.[0],
      } as SearchItemOffline;
    case ES_INDEX_DIRECT:
      return {
        date: fields["item.publicationDate"]?.[0],
        name: fields["item.directAcquisitionName"]?.[0],
        code: fields["item.uniqueIdentificationCode"]?.[0],
        cpvCode: fields["publicDirectAcquisition.cpvCode.localeKey"]?.[0],
        cpvCodeAndName: fields["item.cpvCode"]?.[0],
        value: fields["item.closingValue"]?.[0] || 0,
        supplierId: fields["publicDirectAcquisition.supplierId"]?.[0],
        supplierName: fields["item.supplier"]?.[0],
        supplierFiscalNumber: fields["supplier.numericFiscalNumber"]?.[0],
        localitySupplier: fields["supplier.city"]?.[0],
        countySupplier: fields["supplier.county"]?.[0],
        contractingAuthorityId: fields["publicDirectAcquisition.contractingAuthorityID"]?.[0],
        contractingAuthorityName: fields["item.contractingAuthority"]?.[0],
        authorityFiscalNumber: fields["authority.numericFiscalNumber"]?.[0],
        localityAuthority: fields["authority.city"]?.[0],
        countyAuthority: fields["authority.county"]?.[0],
        state: fields["item.sysDirectAcquisitionState.text"]?.[0],
        stateId: fields["item.sysDirectAcquisitionState.id"]?.[0],
        type: fields["publicDirectAcquisition.sysAcquisitionContractType.text"]?.[0],
        typeId: fields["publicDirectAcquisition.sysAcquisitionContractType.id"]?.[0],
        euFunds: fields["publicDirectAcquisition.sysEuropeanFund.text"]?.[0],
      } as SearchItemDirect;
    case ES_INDEX_PUBLIC: {
      const { prefix, idx } = findMatchingWinnerIndex(fields, ctx);
      const base = `noticeContracts.items.${prefix}`;
      const winnerIds = new Set<string>();
      for (const v of fields["noticeContracts.items.winner.fiscalNumberInt"] || []) {
        if (v !== undefined && v !== null) {
          winnerIds.add(v.toString());
        }
      }
      for (const v of fields["noticeContracts.items.winners.fiscalNumberInt"] || []) {
        if (v !== undefined && v !== null) {
          winnerIds.add(v.toString());
        }
      }
      const winnersCount = winnerIds.size;

      // Compute the company's share of the contract by summing per-lot
      // contractValue at indices where the company is the *primary* winner.
      // Co-winner allocations live in nested winners[] arrays that the ES
      // fields API flattens, so per-lot attribution there isn't recoverable —
      // leave awardedValue undefined in that case so the UI falls back to
      // the full contract value.
      //
      // For framework agreements (acord-cadru), item.ronContractValue is the
      // initial subscription value while noticeContracts.items.contractValue
      // holds per-lot maximum ceilings. The two aren't comparable and a
      // partial-winner share can legitimately exceed ronContractValue; bail
      // in that case so we never render "Cota: X din Y" with X > Y.
      let awardedValue: number | undefined;
      const fiscal = ctx?.supplierFiscalNumber?.toString();
      const entityId = ctx?.supplierEntityId?.toString();
      if (fiscal !== undefined || entityId !== undefined) {
        const primaryFiscals = fields["noticeContracts.items.winner.fiscalNumberInt"] || [];
        const primaryEntityIds = fields["noticeContracts.items.winner.entityId"] || [];
        const contractValues = fields["noticeContracts.items.contractValue"] || [];
        const lotCount = Math.max(primaryFiscals.length, primaryEntityIds.length);
        let sum = 0;
        let matched = false;
        for (let i = 0; i < lotCount; i++) {
          const f = primaryFiscals[i]?.toString();
          const e = primaryEntityIds[i]?.toString();
          if (
            (fiscal !== undefined && f === fiscal) ||
            (entityId !== undefined && e === entityId)
          ) {
            const v = Number(contractValues[i]) || 0;
            sum += v;
            matched = true;
          }
        }
        const ronContractValue = Number(fields["item.ronContractValue"]?.[0]) || 0;
        if (matched && sum <= ronContractValue) {
          awardedValue = sum;
        }
      }

      return {
        date: fields["item.noticeStateDate"]?.[0],
        name: fields["item.contractTitle"]?.[0],
        code: fields["item.noticeNo"]?.[0],
        cpvCode: fields["item.cpvCode"]?.[0],
        cpvCodeAndName: fields["item.cpvCodeAndName"]?.[0],
        value: fields["item.ronContractValue"]?.[0] || 0,
        supplierId: fields[`${base}.entityId`]?.[idx],
        supplierName: fields[`${base}.name`]?.[idx],
        supplierFiscalNumber: fields[`${base}.fiscalNumberInt`]?.[idx],
        localitySupplier: fields[`${base}.address.city`]?.[idx],
        countySupplier:
          fields[`${base}.address.nutsCodeItem.text`]?.[idx] ||
          fields[`${base}.address.county.text`]?.[idx],
        contractingAuthorityId: fields["publicNotice.entityId"]?.[0],
        contractingAuthorityName: fields["item.contractingAuthorityNameAndFN"]?.[0],
        authorityFiscalNumber: fields["item.nationalId"]?.[0],
        localityAuthority:
          fields["publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.city"]?.[0] ||
          fields["publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.city"]?.[0],
        countyAuthority:
          fields[
            "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.nutsCodeItem.text"
          ]?.[0] ||
          fields[
            "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.county.text"
          ]?.[0] ||
          fields[
            "publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.nutsCodeItem.text"
          ]?.[0] ||
          fields[
            "publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.county.text"
          ]?.[0],
        state: fields["item.sysProcedureState.text"]?.[0],
        stateId: fields["item.sysProcedureState.id"]?.[0],
        type: fields["item.sysAcquisitionContractType.text"]?.[0],
        typeId: fields["item.sysAcquisitionContractType.id"]?.[0],
        procedureType: fields["item.sysProcedureType.text"]?.[0],
        procedureTypeId: fields["item.sysProcedureType.id"]?.[0],
        assigmentType: fields["item.sysContractAssigmentType.text"]?.[0],
        assigmentTypeId: fields["item.sysContractAssigmentType.id"]?.[0],
        euFunds:
          fields[
            "publicNotice.caNoticeEdit_New.section2_New.section2_2_New.descriptionList.sysEuropeanFund.text"
          ]?.[0] ||
          fields[
            "publicNotice.caNoticeEdit_New_U.section2_New_U.section2_2_New_U.descriptionList.sysEuropeanFund.text"
          ]?.[0],
        winnersCount,
        awardedValue,
      } as SearchItemPublic;
    }
    default:
      throw new Error(`Invalid index: ${index}`);
  }
}

export const fieldsAchizitii = [
  "item.directAcquisitionId",
  "item.directAcquisitionName",
  "item.sysDirectAcquisitionState.text",
  "item.sysDirectAcquisitionState.id",
  "item.uniqueIdentificationCode",
  "item.cpvCode",
  "item.publicationDate",
  "item.closingValue",
  "item.supplier",
  "item.contractingAuthority",
  "publicDirectAcquisition.cpvCode.*",
  "publicDirectAcquisition.supplierId",
  "publicDirectAcquisition.contractingAuthorityID",
  "publicDirectAcquisition.sysAcquisitionContractType.*",
  "publicDirectAcquisition.sysAcquisitionContractTypeID",
  "publicDirectAcquisition.sysEuropeanFund.text",
  "authority.city",
  "authority.county",
  "authority.numericFiscalNumber",
  "supplier.city",
  "supplier.county",
  "supplier.numericFiscalNumber",
] as const;

export const fieldsAchizitiiOffline = [
  "item.contractId",
  "item.contractObject",
  "item.noticeNo",
  "item.publicationDate",
  "item.awardedValue",
  "item.supplier",
  "item.cpvCategory",
  "item.cpvCode",
  "item.contractingAuthority",
  "item.sysNoticeState.*",
  "details.sysAcquisitionContractType.*",
  "details.cpvCode.*",
  "details.noticeEntityAddress.fiscalNumber",
  "details.noticeEntityAddress.city",
  "details.contractingAuthorityID",
  "details.finalizationDate",
  "details.contractDate",
  "details.sysEuropeanFund.text",
  "authority.city",
  "authority.county",
  "authority.numericFiscalNumber",
  "supplier.entityId",
  "supplier.city",
  "supplier.county",
] as const;

export const filedsLicitatii = [
  "item.caNoticeId",
  "item.noticeNo",
  "item.cpvCode",
  "item.cpvCodeAndName",
  "item.contractingAuthorityNameAndFN",
  "item.contractTitle",
  "item.ronContractValue",
  "item.sysAcquisitionContractType.*",
  "item.sysProcedureType.*",
  "item.sysContractAssigmentType.*",
  "item.sysNoticeState.*",
  "item.sysProcedureState.*",
  "item.cpvCodeAndName",
  "item.noticeStateDate",
  "item.nationalId",
  "publicNotice.entityId",
  "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.city",
  "publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.city",
  "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.county.text",
  "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.nutsCodeItem.text",
  "publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.county.text",
  "publicNotice.caNoticeEdit_New_U.section1_New_U.section1_1.caAddress.nutsCodeItem.text",
  "noticeContracts.items.winner.name",
  "noticeContracts.items.winner.fiscalNumber",
  "noticeContracts.items.winner.fiscalNumberInt",
  "noticeContracts.items.winner.entityId",
  "noticeContracts.items.winner.address.city",
  "noticeContracts.items.winner.address.county.text",
  "noticeContracts.items.winner.address.nutsCodeItem.text",
  "noticeContracts.items.winners.name",
  "noticeContracts.items.winners.fiscalNumber",
  "noticeContracts.items.winners.fiscalNumberInt",
  "noticeContracts.items.winners.entityId",
  "noticeContracts.items.winners.address.city",
  "noticeContracts.items.winners.address.county.text",
  "noticeContracts.items.winners.address.nutsCodeItem.text",
  "noticeContracts.items.contractValue",
  "publicNotice.caNoticeEdit_New.section2_New.section2_2_New.descriptionList.sysEuropeanFund.text",
  "publicNotice.caNoticeEdit_New_U.section2_New_U.section2_2_New_U.descriptionList.sysEuropeanFund.text",
] as const;

export const mapBucket = (b: Bucket) => ({
  key: b.key_as_string,
  count: b.doc_count,
  value: b.sales.value,
});
