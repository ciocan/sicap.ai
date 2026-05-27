import { describe, expect, it } from "vitest";
import {
  companyActivities,
  companyRepresentatives,
  formatOnrcAddress,
  getPrincipalActivity,
  normalizeFinancials,
  pickCanonicalRegistration,
  yoyPercent,
} from "@sicap/api";

// Real shape from the `onrc` index for cui 13154222 (the CARMISTIN / PRO MEAT FRESH
// lineage): one CUI carries many registrations, mostly struck off (radiată), with a
// single active (is_functiune) one. The canonical record is the active registration —
// regardless of its position in the array.
const carmistin = [
  {
    cui: "13154222",
    cod_inmatriculare: "J29/583/2000",
    denumire: "CARMISTIN SRL",
    data_inmatriculare: "2000-06-29",
    is_functiune: false,
    is_radiata: true,
    status_labels: ["radiată"],
  },
  {
    cui: "13154222",
    cod_inmatriculare: "J2022012716401",
    denumire: "CARMISTIN S.R.L.",
    data_inmatriculare: "2022-07-04",
    is_functiune: true,
    is_radiata: false,
    status_labels: ["funcțiune", "urmărire penală"],
  },
  {
    cui: "13154222",
    cod_inmatriculare: "J40/6625/2013",
    denumire: "CARMISTIN SRL",
    data_inmatriculare: "2013-05-24",
    is_functiune: false,
    is_radiata: true,
    status_labels: ["radiată"],
  },
];

describe("pickCanonicalRegistration", () => {
  it("prefers the in-funcțiune registration over struck-off ones", () => {
    expect(pickCanonicalRegistration(carmistin).cod_inmatriculare).toBe("J2022012716401");
  });

  it("falls back to the most recent registration when none are active", () => {
    const allStruckOff = [
      {
        cui: "13154222",
        cod_inmatriculare: "J23/782/2014",
        denumire: "PRO MEAT FRESH SRL",
        data_inmatriculare: "2014-03-18",
        is_functiune: false,
        is_radiata: true,
        status_labels: ["radiată"],
      },
      {
        cui: "13154222",
        cod_inmatriculare: "J38/781/2018",
        denumire: "PRO MEAT FRESH S.R.L.",
        data_inmatriculare: "2018-10-02",
        is_functiune: false,
        is_radiata: true,
        status_labels: ["radiată"],
      },
      {
        cui: "13154222",
        cod_inmatriculare: "J40/2361/2016",
        denumire: "PRO MEAT FRESH SRL",
        data_inmatriculare: "2016-02-18",
        is_functiune: false,
        is_radiata: true,
        status_labels: ["radiată"],
      },
    ];
    expect(pickCanonicalRegistration(allStruckOff).cod_inmatriculare).toBe("J38/781/2018");
  });
});

describe("normalizeFinancials", () => {
  // Two years, deliberately out of order; one profitable, one a loss.
  const raw = [
    {
      cui: "2816464",
      an: 2023,
      cifra_afaceri: 1000,
      profit_net: 0,
      pierdere_neta: 200,
      active_imobilizate: 50,
      active_circulante: 30,
      datorii: 400,
      capitaluri: -100,
    },
    {
      cui: "2816464",
      an: 2022,
      cifra_afaceri: 800,
      profit_net: 150,
      pierdere_neta: 0,
      active_imobilizate: 40,
      active_circulante: 20,
      datorii: 300,
      capitaluri: 60,
    },
  ];

  it("orders years chronologically", () => {
    expect(normalizeFinancials(raw).map((y) => y.an)).toEqual([2022, 2023]);
  });

  it("derives net result as profit minus loss (negative in a loss year)", () => {
    const [y2022, y2023] = normalizeFinancials(raw);
    expect(y2022.netResult).toBe(150);
    expect(y2023.netResult).toBe(-200);
  });

  it("derives total assets from fixed plus current assets", () => {
    expect(normalizeFinancials(raw)[0].totalAssets).toBe(60);
  });

  it("maps nr_salariati to the employee count", () => {
    const [year] = normalizeFinancials([{ cui: "1", an: 2016, nr_salariati: 3 }]);
    expect(year.nrSalariati).toBe(3);
  });

  it("leaves the employee count undefined when nr_salariati is absent", () => {
    const [year] = normalizeFinancials([{ cui: "1", an: 2016 }]);
    expect(year.nrSalariati).toBeUndefined();
  });
});

describe("getPrincipalActivity", () => {
  const activitati = [
    { clasa: "4711", denumire: "Comerț cu amănuntul" },
    { clasa: "1011", denumire: "Prelucrarea cărnii" },
  ];

  it("matches the declared main CAEN to its activity", () => {
    expect(getPrincipalActivity(activitati, "1011")).toEqual({
      code: "1011",
      name: "Prelucrarea cărnii",
    });
  });

  it("falls back to the first activity when the main CAEN is not listed", () => {
    expect(getPrincipalActivity(activitati, "9999")).toEqual({
      code: "4711",
      name: "Comerț cu amănuntul",
    });
  });

  it("returns null when there are no activities", () => {
    expect(getPrincipalActivity([], "1011")).toBeNull();
  });
});

describe("yoyPercent", () => {
  it("computes year-over-year growth as a rounded percentage", () => {
    expect(yoyPercent(120, 100)).toBe(20);
  });

  it("returns null when the previous value is zero or missing", () => {
    expect(yoyPercent(120, 0)).toBeNull();
  });
});

describe("formatOnrcAddress", () => {
  it("joins street, locality, county and postal code into one line", () => {
    expect(
      formatOnrcAddress({
        strada: "Strada Florilor",
        nr: "12",
        localitate: "Municipiul Râmnicu Sărat",
        judet: "Buzău",
        cod_postal: "125300",
      }),
    ).toBe("Strada Florilor nr. 12, Municipiul Râmnicu Sărat, Buzău, 125300");
  });

  it("includes the Bucharest sector when present", () => {
    expect(
      formatOnrcAddress({ strada: "Bd. Unirii", nr: "1", sector: "3", localitate: "București" }),
    ).toBe("Bd. Unirii nr. 1, sector 3, București");
  });

  it("omits missing parts", () => {
    expect(formatOnrcAddress({ localitate: "Cluj-Napoca", judet: "Cluj" })).toBe(
      "Cluj-Napoca, Cluj",
    );
  });

  it("returns null when there is no usable address", () => {
    expect(formatOnrcAddress(undefined)).toBeNull();
    expect(formatOnrcAddress({})).toBeNull();
  });

  it("prepends 'Str.' when the street name has no street-type prefix", () => {
    expect(formatOnrcAddress({ strada: "ZEFIRULUI", nr: "6", localitate: "Buzău" })).toBe(
      "Str. ZEFIRULUI nr. 6, Buzău",
    );
  });

  it("keeps an existing street-type prefix", () => {
    expect(formatOnrcAddress({ strada: "Calea Victoriei", nr: "1", localitate: "București" })).toBe(
      "Calea Victoriei nr. 1, București",
    );
  });
});

describe("companyRepresentatives", () => {
  const raw = [
    {
      nume: "POPESCU ION",
      calitate: "Administrator",
      data_nastere: "1970-01-01",
      localitate_nastere: "Buzău",
    },
    { nume: "POPESCU ION", calitate: "Administrator", data_nastere: "1970-01-01" },
    { nume: "IONESCU MARIA", calitate: "Asociat" },
  ];

  it("returns names and roles only, dropping birth data", () => {
    expect(companyRepresentatives(raw)).toEqual([
      { nume: "POPESCU ION", calitate: "Administrator" },
      { nume: "IONESCU MARIA", calitate: "Asociat" },
    ]);
  });

  it("never leaks date of birth", () => {
    for (const rep of companyRepresentatives(raw)) {
      expect(Object.keys(rep).sort()).toEqual(["calitate", "nume"]);
    }
  });

  it("returns an empty array when there are no representatives", () => {
    expect(companyRepresentatives(undefined)).toEqual([]);
    expect(companyRepresentatives([])).toEqual([]);
  });
});

describe("companyActivities", () => {
  it("dedupes by CAEN code and maps to code + name", () => {
    expect(
      companyActivities([
        { clasa: "4711", denumire: "Comerț cu amănuntul" },
        { clasa: "4711", denumire: "Comerț cu amănuntul" },
        { clasa: "1011", denumire: "Prelucrarea cărnii" },
      ]),
    ).toEqual([
      { code: "4711", name: "Comerț cu amănuntul" },
      { code: "1011", name: "Prelucrarea cărnii" },
    ]);
  });

  it("returns an empty array when there are no activities", () => {
    expect(companyActivities(undefined)).toEqual([]);
    expect(companyActivities([])).toEqual([]);
  });
});
