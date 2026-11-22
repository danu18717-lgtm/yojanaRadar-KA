import { describe, it, expect } from "vitest";
import { daysLeft, isUrgent, findUrgentPending, TODAY } from "./urgency";
import type { Member, MatchResult, Scheme } from "../types";

function makeScheme(id: string, lastDate: string): Scheme {
  return {
    id,
    name: `Scheme ${id}`,
    type: "SCHEME",
    last_date: lastDate,
    benefitSummary: "",
    officialUrl: "",
    lastVerified: TODAY,
    applicationMode: "BOTH",
    documents: [],
    rules: { appliesTo: "self" },
    verificationNote: "",
  } as Scheme;
}

function makeMember(id: string, name: string): Member {
  return { id, name, relationship: "Self" } as Member;
}

const ELIGIBLE: MatchResult = { eligible: true, reasons: [] };

describe("daysLeft", () => {
  it("counts whole days from TODAY", () => {
    expect(daysLeft("2026-11-25")).toBe(4);
    expect(daysLeft("2026-11-21")).toBe(0);
    expect(daysLeft("2026-11-26")).toBe(5);
    expect(daysLeft("2026-11-27")).toBe(6);
  });

  it("returns null for Ongoing", () => {
    expect(daysLeft("Ongoing")).toBeNull();
  });
});

describe("isUrgent", () => {
  it("is true within the 5-day window", () => {
    expect(isUrgent(makeScheme("a", "2026-11-24"))).toBe(true);
  });

  it("is false well outside the window", () => {
    expect(isUrgent(makeScheme("b", "2026-12-20"))).toBe(false);
  });
});

describe("findUrgentPending", () => {
  const scheme = makeScheme("s1", "2026-11-24");
  const member = makeMember("m1", "Asha");
  const pairs = [{ member, scheme, result: ELIGIBLE }];

  it("excludes APPLIED pairs", () => {
    expect(findUrgentPending(pairs, () => "APPLIED")).toEqual([]);
  });

  it("excludes NOT_INTERESTED pairs", () => {
    expect(findUrgentPending(pairs, () => "NOT_INTERESTED")).toEqual([]);
  });

  it("includes PENDING pairs", () => {
    const items = findUrgentPending(pairs, () => "PENDING");
    expect(items).toHaveLength(1);
    expect(items[0].memberId).toBe("m1");
    expect(items[0].daysLeft).toBe(3);
  });
});
