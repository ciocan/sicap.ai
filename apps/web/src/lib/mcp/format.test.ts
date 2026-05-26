import { describe, expect, it } from "vitest";
import { clampPerPage, contractUrl, toCompactRow } from "./format";

describe("clampPerPage", () => {
  it("defaults to 10 when undefined", () => expect(clampPerPage(undefined)).toBe(10));
  it("defaults to 10 when < 1", () => expect(clampPerPage(0)).toBe(10));
  it("passes through a value within range", () => expect(clampPerPage(25)).toBe(25));
  it("caps at 50", () => expect(clampPerPage(500)).toBe(50));
});

describe("contractUrl", () => {
  it("builds a licitatii contract URL", () =>
    expect(contractUrl("licitatii", "abc")).toBe("https://sicap.ai/licitatii/contract/abc"));
  it("builds an achizitii contract URL", () =>
    expect(contractUrl("achizitii", "abc")).toBe("https://sicap.ai/achizitii/contract/abc"));
  it("builds an achizitii-offline contract URL", () =>
    expect(contractUrl("achizitii-offline", "abc")).toBe(
      "https://sicap.ai/achizitii-offline/contract/abc",
    ));
});

describe("toCompactRow", () => {
  it("projects an ES item to the compact shape using the given slug", () => {
    const row = toCompactRow(
      {
        id: "id1",
        fields: {
          date: "2025-01-01",
          name: "Servicii curatenie",
          code: "C123",
          cpvCode: "90910000",
          cpvCodeAndName: "90910000 - Servicii de curatenie",
          value: "12000",
          supplierId: "s1",
          supplierName: "ACME SRL",
          supplierFiscalNumber: "RO1",
          localitySupplier: "Cluj",
          countySupplier: "CJ",
          contractingAuthorityId: "a1",
          contractingAuthorityName: "Primaria Cluj",
          authorityFiscalNumber: "RO2",
          localityAuthority: "Cluj",
          countyAuthority: "CJ",
          state: "atribuit",
          stateId: 1,
          type: "contract",
          typeId: 1,
          euFunds: "false",
        },
      },
      "achizitii",
    );
    expect(row).toEqual({
      id: "id1",
      type: "achizitii",
      object: "90910000 - Servicii de curatenie",
      authority: "Primaria Cluj",
      supplier: "ACME SRL",
      value: "12000",
      date: "2025-01-01",
      cpv: "90910000",
      url: "https://sicap.ai/achizitii/contract/id1",
    });
  });

  it("falls back to name when cpvCodeAndName is empty", () => {
    const row = toCompactRow(
      { id: "id2", fields: { cpvCodeAndName: "", name: "Lucrari drum" } as never },
      "licitatii",
    );
    expect(row.object).toBe("Lucrari drum");
    expect(row.url).toBe("https://sicap.ai/licitatii/contract/id2");
  });
});
