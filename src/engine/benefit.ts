import type { MatchResult, Member, Scheme } from "../types";

const LAKH = 100000;
const MONEY_MARKER = /₹|\bRs\.?(?=\s|\d)/i;
const MONTHLY_MARKER = /\/\s*month|per\s+month|monthly/i;
const LAKH_MARKER = /\blakhs?\b/i;
const AMOUNT_PATTERN = /\d[\d,]*(?:\.\d+)?/;

/** One member x scheme pair, as produced by matchHousehold. */
export interface MatchPair {
  member: Member;
  scheme: Scheme;
  result: MatchResult;
}

/**
 * Parses the annual rupee value out of a free-text benefit string.
 * - "₹2,000/month" -> 24000 (monthly x12)
 * - "₹1.5 Lakh" -> 150000
 * - "₹2,00,000" -> 200000, "₹11,000" -> 11000
 * Strings without a rupee marker (e.g. "amount varies by course") or without a
 * number return 0. Never throws.
 */
export function parseAnnualBenefit(text: unknown): number {
  if (typeof text !== "string") return 0;
  const marker = MONEY_MARKER.exec(text);
  if (!marker) return 0;

  // Only the first number after the rupee marker is the amount.
  const match = AMOUNT_PATTERN.exec(text.slice(marker.index + marker[0].length));
  if (!match) return 0;

  const amount = Number(match[0].replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  const lakhFactor = LAKH_MARKER.test(text) ? LAKH : 1;
  const monthFactor = MONTHLY_MARKER.test(text) ? 12 : 1;
  const annual = amount * lakhFactor * monthFactor;
  return Number.isFinite(annual) ? annual : 0;
}

/**
 * Sums the annual rupee value of every "Likely Eligible" welfare match across all
 * household members. Only schemes of type 'SCHEME' count (job and exam vacancies are
 * ignored), and only pairs whose result.eligible is true.
 * The scheme is looked up by id in `schemes` so the latest scheme data is used; the
 * scheme on the pair is the fallback when the id is not found.
 */
export function calculateTotalEligibleBenefit(
  matches: readonly MatchPair[],
  schemes: readonly Scheme[],
): number {
  const byId = new Map(schemes.map((s) => [s.id, s]));
  let total = 0;
  for (const pair of matches) {
    if (!pair.result.eligible) continue;
    if (pair.scheme.type !== "SCHEME") continue;
    const scheme = byId.get(pair.scheme.id) ?? pair.scheme;
    total += parseAnnualBenefit(scheme.benefitSummary);
  }
  return total;
}

/** Formats an annual rupee total for the top-right pill, e.g. "₹2.45L+ Eligible". */
export function formatEligibleBenefit(total: number): string {
  if (total >= 100000) return "₹" + (total / 100000).toFixed(2).replace(/\.00$/, "") + "L+ Eligible";
  if (total >= 1000) return "₹" + Math.round(total / 1000) + "K+ Eligible";
  if (total > 0) return "₹" + total.toLocaleString("en-IN") + " Eligible";
  return "-";
}
