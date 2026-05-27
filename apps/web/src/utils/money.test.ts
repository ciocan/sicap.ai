import { describe, expect, it } from "vitest";
import { moneyRonCompact } from "./money";

describe("moneyRonCompact", () => {
  it("abbreviates billions as 'mld lei' with one decimal", () => {
    expect(moneyRonCompact(12_294_042_595)).toBe("12,3 mld lei");
  });

  it("abbreviates millions as 'mil. lei'", () => {
    expect(moneyRonCompact(17_853_000)).toBe("17,9 mil. lei");
  });

  it("abbreviates thousands as 'mii lei' without decimals", () => {
    expect(moneyRonCompact(17_853)).toBe("18 mii lei");
  });

  it("keeps small amounts in plain lei", () => {
    expect(moneyRonCompact(215)).toBe("215 lei");
  });

  it("preserves the sign for losses", () => {
    expect(moneyRonCompact(-46_702)).toBe("-47 mii lei");
  });
});
