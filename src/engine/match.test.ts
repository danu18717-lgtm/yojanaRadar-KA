import { describe, it, expect } from "vitest";
import type { HouseholdProfile, Member } from "../types";
import { schemes } from "../data/seed";
import { evaluateScheme, matchHousehold } from "./match";

// Test-only fixtures. The app itself starts with an empty family; these exist only for these tests.
const sampleHousehold: Member[] = [
  {
    id: "m-father",
    name: "Ramappa",
    relationship: "Father",
    age: 48,
    gender: "Male",
    category: "OBC-2A",
    occupation: "Farmer",
    annualIncome: 140000,
    hasLandholding: true,
    passed10th: false,
    post10thDomain: null,
    maritalStatus: "Married",
    pwbd: false,
    ruralKannadaMediumQuota: false,
    educationStatus: null,
  },
  {
    id: "m-mother",
    name: "Lakshmamma",
    relationship: "Mother",
    age: 45,
    gender: "Female",
    category: "OBC-2A",
    occupation: "Homemaker",
    annualIncome: 140000,
    hasLandholding: true,
    passed10th: false,
    post10thDomain: null,
    maritalStatus: "Married",
    pwbd: false,
    ruralKannadaMediumQuota: false,
    educationStatus: null,
  },
  {
    id: "m-son",
    name: "Manjunath",
    relationship: "Son",
    age: 19,
    gender: "Male",
    category: "OBC-2A",
    occupation: "Student",
    annualIncome: 140000,
    hasLandholding: true,
    passed10th: true,
    post10thDomain: "Professional - BE/B.Tech/MBBS/Law",
    maritalStatus: "Unmarried",
    pwbd: false,
    ruralKannadaMediumQuota: false,
    educationStatus: "Currently Studying",
  },
];

const sampleHouseholdProfile: HouseholdProfile = {
  district: "Ramanagara",
  pincode: "562160",
  rationCardType: "BPL",
  anyMemberPaysIncomeTaxOrGst: false,
  ownsPuccaHouse: false,
};

const son = sampleHousehold.find((m) => m.id === "m-son") as Member;
const scheme = (id: string) => {
  const s = schemes.find((x) => x.id === id);
  if (!s) throw new Error(`Missing scheme ${id}`);
  return s;
};

describe("evaluateScheme", () => {
  it("matches the son to s-1 with the Professional domain reason passed", () => {
    const result = evaluateScheme(scheme("s-1"), son, sampleHousehold);
    expect(result.eligible).toBe(true);
    const domainReason = result.reasons.find((r) => r.criterion === "Post-10th domain");
    expect(domainReason).toBeDefined();
    expect(domainReason?.passed).toBe(true);
  });

  it("fails s-1 for a student who has not passed 10th", () => {
    const student = { ...son, passed10th: false, post10thDomain: null };
    const result = evaluateScheme(scheme("s-1"), student, sampleHousehold);
    expect(result.eligible).toBe(false);
    const domainReason = result.reasons.find((r) => r.criterion === "Post-10th domain");
    expect(domainReason?.passed).toBe(false);
    expect(domainReason?.actual).toBe("Not passed 10th (SSLC)");
  });

  it("fails s-4 (ageMax 35) for a 70-year-old unemployed member", () => {
    const senior = { ...son, age: 70, occupation: "Unemployed" as const };
    const result = evaluateScheme(scheme("s-4"), senior, sampleHousehold);
    expect(result.eligible).toBe(false);
    const ageReason = result.reasons.find((r) => r.criterion === "Maximum age");
    expect(ageReason?.passed).toBe(false);
  });

  it("fails s-1 for a General category member", () => {
    const general = { ...son, category: "General" as const };
    const result = evaluateScheme(scheme("s-1"), general, sampleHousehold);
    expect(result.eligible).toBe(false);
    const categoryReason = result.reasons.find((r) => r.criterion === "Allowed category");
    expect(categoryReason?.passed).toBe(false);
  });
});

describe("matchHousehold", () => {
  it("returns every member x scheme pair", () => {
    const pairs = matchHousehold(sampleHousehold, schemes);
    expect(pairs).toHaveLength(sampleHousehold.length * schemes.length);
  });

  it("returns every member x scheme pair when a household profile is passed", () => {
    const pairs = matchHousehold(sampleHousehold, schemes, sampleHouseholdProfile);
    expect(pairs).toHaveLength(sampleHousehold.length * schemes.length);
  });
});

describe("new household and member fields", () => {
  const mother = sampleHousehold.find((m) => m.id === "m-mother") as Member;

  it("makes the Mother eligible for s-3 with a BPL card and no tax, with Ration card passed", () => {
    const result = evaluateScheme(scheme("s-3"), mother, sampleHousehold, sampleHouseholdProfile);
    expect(result.eligible).toBe(true);
    const rationReason = result.reasons.find((r) => r.criterion === "Ration card type");
    expect(rationReason?.passed).toBe(true);
  });

  it("makes the Mother NOT eligible for s-3 when the ration card is None", () => {
    const profile = { ...sampleHouseholdProfile, rationCardType: "None" as const };
    const result = evaluateScheme(scheme("s-3"), mother, sampleHousehold, profile);
    expect(result.eligible).toBe(false);
    const rationReason = result.reasons.find((r) => r.criterion === "Ration card type");
    expect(rationReason?.passed).toBe(false);
  });

  it("makes the Mother NOT eligible for s-3 when a member pays income tax or GST", () => {
    const profile = { ...sampleHouseholdProfile, anyMemberPaysIncomeTaxOrGst: true };
    const result = evaluateScheme(scheme("s-3"), mother, sampleHousehold, profile);
    expect(result.eligible).toBe(false);
    const taxReason = result.reasons.find((r) => r.criterion === "Family pays Income Tax/GST");
    expect(taxReason?.passed).toBe(false);
  });

  it("makes the Son eligible for g-1 with the household profile", () => {
    const result = evaluateScheme(scheme("g-1"), son, sampleHousehold, sampleHouseholdProfile);
    expect(result.eligible).toBe(true);
  });

  it("makes an OBC-2A Son aged 37 eligible for g-1 (OBC maximum age 38)", () => {
    const older = { ...son, age: 37, category: "OBC-2A" as const };
    const result = evaluateScheme(scheme("g-1"), older, sampleHousehold, sampleHouseholdProfile);
    expect(result.eligible).toBe(true);
  });

  it("makes a General Son aged 37 NOT eligible for g-1 (maximum age 35)", () => {
    const older = { ...son, age: 37, category: "General" as const };
    const result = evaluateScheme(scheme("g-1"), older, sampleHousehold, sampleHouseholdProfile);
    expect(result.eligible).toBe(false);
    const ageReason = result.reasons.find((r) => r.criterion === "Age (maximum, by category)");
    expect(ageReason?.passed).toBe(false);
  });

  it("makes the Son (age 19) NOT eligible for e-1 because the minimum age is 21", () => {
    const result = evaluateScheme(scheme("e-1"), son, sampleHousehold, sampleHouseholdProfile);
    expect(result.eligible).toBe(false);
    const ageReason = result.reasons.find((r) => r.criterion === "Minimum age");
    expect(ageReason?.passed).toBe(false);
  });

  it("adds a Reservation quota reason for a PwBD Son and keeps him eligible for g-1", () => {
    const pwbdSon = { ...son, pwbd: true };
    const result = evaluateScheme(scheme("g-1"), pwbdSon, sampleHousehold, sampleHouseholdProfile);
    expect(result.eligible).toBe(true);
    const quotaReason = result.reasons.find((r) => r.criterion === "Reservation quota");
    expect(quotaReason).toBeDefined();
    expect(quotaReason?.passed).toBe(true);
  });
});
