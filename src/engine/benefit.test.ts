import { describe, expect, it } from "vitest";
import type { Member, MatchResult, Scheme } from "../types";
import {
  calculateTotalEligibleBenefit,
  formatEligibleBenefit,
  parseAnnualBenefit,
  type MatchPair,
} from "./benefit";

const member: Member = {
  id: "m-1",
  name: "Test",
  relationship: "Self",
  age: 30,
  gender: "Female",
  category: "General",
  occupation: "Homemaker",
  annualIncome: 100000,
  hasLandholding: false,
  passed10th: true,
  post10thDomain: null,
  maritalStatus: null,
  pwbd: false,
  ruralKannadaMediumQuota: false,
  educationStatus: null,
};

const eligible: MatchResult = { eligible: true, reasons: [] };
const notEligible: MatchResult = { eligible: false, reasons: [] };

function scheme(id: string, benefitSummary: string, type: Scheme["type"] = "SCHEME"): Scheme {
  return {
    id,
    name: `Scheme ${id}`,
    type,
    last_date: "Ongoing",
    benefitSummary,
    officialUrl: "https://example.com/",
    lastVerified: "2026-01-01",
    applicationMode: "ONLINE_ONLY",
    documents: [],
    rules: { appliesTo: "self" },
    verificationNote: "",
  };
}

describe("parseAnnualBenefit", () => {
  it("converts a monthly amount to annual", () => {
    expect(parseAnnualBenefit("₹2,000/month")).toBe(24000);
  });

  it("converts Lakh amounts", () => {
    expect(parseAnnualBenefit("₹1.5 Lakh")).toBe(150000);
  });

  it("parses Indian comma grouping", () => {
    expect(parseAnnualBenefit("₹2,00,000")).toBe(200000);
    expect(parseAnnualBenefit("₹11,000")).toBe(11000);
  });

  it("returns 0 for non-monetary text without throwing", () => {
    expect(parseAnnualBenefit("amount varies by course")).toBe(0);
    expect(parseAnnualBenefit("Monthly cash assistance to the woman head of household.")).toBe(0);
    expect(parseAnnualBenefit("")).toBe(0);
    expect(parseAnnualBenefit(undefined)).toBe(0);
  });
});

describe("calculateTotalEligibleBenefit", () => {
  it("sums Likely Eligible welfare matches across members", () => {
    const s1 = scheme("s-1", "₹2,000/month");
    const s2 = scheme("s-2", "₹1.5 Lakh");
    const matches: MatchPair[] = [
      { member, scheme: s1, result: eligible },
      { member: { ...member, id: "m-2" }, scheme: s1, result: eligible },
      { member, scheme: s2, result: eligible },
    ];
    expect(calculateTotalEligibleBenefit(matches, [s1, s2])).toBe(24000 * 2 + 150000);
  });

  it("ignores non-Likely-Eligible matches", () => {
    const s1 = scheme("s-1", "₹11,000");
    const matches: MatchPair[] = [{ member, scheme: s1, result: notEligible }];
    expect(calculateTotalEligibleBenefit(matches, [s1])).toBe(0);
  });

  it("ignores non-monetary benefit text", () => {
    const s1 = scheme("s-1", "amount varies by course");
    const matches: MatchPair[] = [{ member, scheme: s1, result: eligible }];
    expect(calculateTotalEligibleBenefit(matches, [s1])).toBe(0);
  });

  it("ignores job and exam entries", () => {
    const job = scheme("j-1", "₹2,00,000", "GOVT_JOB");
    const exam = scheme("e-1", "₹50,000", "EXAM");
    const matches: MatchPair[] = [
      { member, scheme: job, result: eligible },
      { member, scheme: exam, result: eligible },
    ];
    expect(calculateTotalEligibleBenefit(matches, [job, exam])).toBe(0);
  });
});

describe("benefit parsing rules", () => {
  it("multiplies monthly amounts by 12", () => {
    expect(parseAnnualBenefit("₹2,000/month")).toBe(24000);
    expect(parseAnnualBenefit("Rs. 1,000 per month")).toBe(12000);
    expect(parseAnnualBenefit("₹500 monthly")).toBe(6000);
  });

  it("multiplies lakh amounts by 100000", () => {
    expect(parseAnnualBenefit("₹1.5 Lakh")).toBe(150000);
    expect(parseAnnualBenefit("₹2 lakhs")).toBe(200000);
  });

  it("parses comma grouping, including Indian grouping", () => {
    expect(parseAnnualBenefit("₹2,00,000")).toBe(200000);
    expect(parseAnnualBenefit("Rs. 11,000")).toBe(11000);
  });

  it("uses the first number after the rupee marker", () => {
    expect(parseAnnualBenefit("Pays 2 years of ₹5,000")).toBe(5000);
  });

  it("ignores plain numbers without a rupee or Rs marker", () => {
    expect(parseAnnualBenefit("Covers 5,000 students")).toBe(0);
  });
});

describe("calculateTotalEligibleBenefit rules", () => {
  it("counts only eligible pairs", () => {
    const s1 = scheme("s-1", "₹11,000");
    const matches: MatchPair[] = [
      { member, scheme: s1, result: notEligible },
      { member: { ...member, id: "m-2" }, scheme: s1, result: eligible },
    ];
    expect(calculateTotalEligibleBenefit(matches, [s1])).toBe(11000);
  });

  it("ignores job and exam entries even when eligible", () => {
    const job = scheme("g-1", "₹2,00,000", "GOVT_JOB");
    const exam = scheme("e-1", "₹50,000", "EXAM");
    const matches: MatchPair[] = [
      { member, scheme: job, result: eligible },
      { member, scheme: exam, result: eligible },
    ];
    expect(calculateTotalEligibleBenefit(matches, [job, exam])).toBe(0);
  });
});

describe("formatEligibleBenefit", () => {
  it("formats zero", () => {
    expect(formatEligibleBenefit(0)).toBe("-");
  });

  it("formats amounts under 1000 in rupees", () => {
    expect(formatEligibleBenefit(999)).toBe("₹999 Eligible");
  });

  it("formats thousands as K+", () => {
    expect(formatEligibleBenefit(59000)).toBe("₹59K+ Eligible");
  });

  it("formats lakhs as L+", () => {
    expect(formatEligibleBenefit(245000)).toBe("₹2.45L+ Eligible");
  });
});
