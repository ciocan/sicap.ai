import { describe, expect, it } from "vitest";
import {
  isCourtAppointedRole,
  matchedPersonKeys,
  normalizeRepName,
  representativePersonKeys,
} from "@sicap/api";

describe("normalizeRepName", () => {
  it("uppercases and collapses whitespace", () => {
    expect(normalizeRepName("  Rusu   Alina ")).toBe("RUSU ALINA");
  });

  it("folds diacritics so spelling variants of one name align", () => {
    expect(normalizeRepName("Posteucă Cătălin-Marian")).toBe(
      normalizeRepName("POSTEUCA CATALIN-MARIAN"),
    );
  });
});

describe("isCourtAppointedRole", () => {
  it("flags judicial liquidators and administrators", () => {
    expect(isCourtAppointedRole("lichidator judiciar")).toBe(true);
    expect(isCourtAppointedRole("Administrator judiciar")).toBe(true);
  });

  it("does not flag ordinary company roles", () => {
    expect(isCourtAppointedRole("administrator")).toBe(false);
    expect(isCourtAppointedRole("asociat")).toBe(false);
    expect(isCourtAppointedRole(undefined)).toBe(false);
  });
});

describe("representativePersonKeys", () => {
  // Mirrors real onrc data: a liquidator cabinet (entity, no dob), a natural person, and
  // two family-enterprise members (reprezentanti_if), each a natural person with a dob.
  const reprezentanti = [
    { nume: "CII RUSU ALINA", calitate: "lichidator judiciar" },
    {
      nume: "RUSU ALINA",
      calitate: "reprezentant al persoanei juridice",
      data_nastere: "1972-11-20",
    },
  ];
  const reprezentanti_if = [
    {
      nume: "POSTEUCĂ CĂTĂLINA-MANUELA",
      calitate: "reprezentant întreprindere familiala",
      data_nastere: "1982-01-02",
    },
    {
      nume: "POSTEUCĂ CĂTĂLIN-MARIAN",
      calitate: "membru întreprindere familiala",
      data_nastere: "1987-01-31",
    },
  ];

  it("keeps natural persons from both arrays, keyed by name + date of birth", () => {
    const keys = representativePersonKeys(reprezentanti, reprezentanti_if).map((k) => k.key);
    expect(keys).toContain("RUSU ALINA|1972-11-20");
    expect(keys).toContain("POSTEUCA CATALINA-MANUELA|1982-01-02");
    expect(keys).toContain("POSTEUCA CATALIN-MARIAN|1987-01-31");
  });

  it("drops representatives without a date of birth (legal entities)", () => {
    const keys = representativePersonKeys(reprezentanti, reprezentanti_if);
    expect(keys.some((k) => k.nume === "CII RUSU ALINA")).toBe(false);
  });

  it("drops court-appointed roles even when a date of birth is present", () => {
    const keys = representativePersonKeys(
      [{ nume: "POPESCU ION", calitate: "administrator judiciar", data_nastere: "1960-05-05" }],
      [],
    );
    expect(keys).toEqual([]);
  });

  it("dedupes a person who recurs across registrations", () => {
    const keys = representativePersonKeys(
      [
        { nume: "RUSU ALINA", data_nastere: "1972-11-20" },
        { nume: "RUSU  ALINA", data_nastere: "1972-11-20" },
      ],
      [],
    );
    expect(keys).toHaveLength(1);
  });
});

describe("matchedPersonKeys", () => {
  const keys = new Set(["RUSU ALINA|1972-11-20"]);

  it("matches when one representative element carries both the name and the dob", () => {
    const doc = { reprezentanti: [{ nume: "RUSU ALINA", data_nastere: "1972-11-20" }] };
    expect([...matchedPersonKeys(doc, keys)]).toEqual(["RUSU ALINA|1972-11-20"]);
  });

  it("does not match when the name and dob come from different elements", () => {
    // Guards against object-mapped arrays cross-matching fields inside one Elasticsearch doc.
    const doc = {
      reprezentanti: [
        { nume: "RUSU ALINA", data_nastere: "1999-01-01" },
        { nume: "ALT NUME", data_nastere: "1972-11-20" },
      ],
    };
    expect(matchedPersonKeys(doc, keys).size).toBe(0);
  });

  it("checks the reprezentanti_if array as well", () => {
    const doc = { reprezentanti_if: [{ nume: "RUSU ALINA", data_nastere: "1972-11-20" }] };
    expect(matchedPersonKeys(doc, keys).size).toBe(1);
  });
});
