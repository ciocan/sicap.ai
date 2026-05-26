import { describe, expect, it } from "vitest";
import { clampPerPage, contractUrl, toCompactRow } from "./format";

describe("clampPerPage", () => {
  it("defaults to 10 when undefined", () => expect(clampPerPage(undefined)).toBe(10));
  it("defaults to 10 when < 1", () => expect(clampPerPage(0)).toBe(10));
  it("passes through a value within range", () => expect(clampPerPage(25)).toBe(25));
  it("caps at 50", () => expect(clampPerPage(500)).toBe(50));
});

describe("contractUrl", () => {
  it("builds a licitatii URL for public", () =>
    expect(contractUrl("public", "abc")).toBe("https://sicap.ai/licitatii/abc"));
  it("builds an achizitii URL for direct", () =>
    expect(contractUrl("direct", "abc")).toBe("https://sicap.ai/achizitii/abc"));
  it("builds an achizitii-offline URL for offline", () =>
    expect(contractUrl("offline", "abc")).toBe("https://sicap.ai/achizitii-offline/abc"));
});

describe("toCompactRow", () => {
  it("projects an ES item to the compact shape", () => {
    const row = toCompactRow({
      id: "id1",
      index: "direct",
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
    });
    expect(row).toEqual({
      id: "id1",
      type: "direct",
      object: "90910000 - Servicii de curatenie",
      authority: "Primaria Cluj",
      supplier: "ACME SRL",
      value: "12000",
      date: "2025-01-01",
      cpv: "90910000",
      url: "https://sicap.ai/achizitii/id1",
    });
  });

  it("falls back to name when cpvCodeAndName is empty", () => {
    const row = toCompactRow({
      id: "id2",
      index: "public",
      fields: { cpvCodeAndName: "", name: "Lucrari drum" } as never,
    });
    expect(row.object).toBe("Lucrari drum");
    expect(row.url).toBe("https://sicap.ai/licitatii/id2");
  });
});
