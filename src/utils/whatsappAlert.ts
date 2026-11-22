import { daysLeft } from "../engine/urgency";
import type { Scheme, SchemeType } from "../types";

/** Display label for each scheme type, as used in WhatsApp messages. */
export const SCHEME_KIND_LABEL: Record<SchemeType, string> = {
  SCHEME: "Welfare Scheme",
  GOVT_JOB: "Govt Job",
  EXAM: "Exam",
};

const DIGEST_HEADER = "*YojanaRadar KA — Eligibility & Deadline Digest*";
const CLOSING_LINE = "Check details at YojanaRadar KA. Verify on official government portals before applying.";
const MAX_MESSAGE_LENGTH = 1500;

export interface WhatsAppMatchItem {
  title: string;
  kind: string;
  benefitText?: string;
  benefitAmount: number;
  deadline?: string | null;
  daysLeft?: number | null;
  documents?: string[];
}

export interface WhatsAppDigestInput {
  householdLabel?: string;
  matches: WhatsAppMatchItem[];
  totalAnnualBenefit: number;
}

/**
 * Returns the 10-digit Indian mobile number (starting 6-9) from a plain or +91-prefixed input,
 * or null when the input is not a valid number.
 */
export function normalizeIndianPhone(input: string | null | undefined): string | null {
  if (typeof input !== "string") return null;
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(-10);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

function formatRupees(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function pluralDays(days: number): string {
  return `${days} day${days === 1 ? "" : "s"}`;
}

/** Deadline line with urgency; null when there is no deadline to show. */
function deadlineText(deadline: string | null | undefined, days: number | null | undefined): string | null {
  if (!deadline) return null;
  if (days === null || days === undefined) return `Last date: ${deadline}`;
  if (days < 0) return "Deadline passed";
  if (days === 0) return `Closes today (${deadline})`;
  return `Closes in ${pluralDays(days)} (${deadline})`;
}

function benefitLine(text: string | undefined, amount: number): string {
  const trimmed = text?.trim();
  if (trimmed) return trimmed;
  return amount > 0 ? `${formatRupees(amount)} per year` : "See official portal";
}

function renderDigest(input: WhatsAppDigestInput, shown: number): string {
  const { householdLabel, matches, totalAnnualBenefit } = input;
  const lines: string[] = [DIGEST_HEADER];
  if (householdLabel?.trim()) lines.push(householdLabel.trim());
  lines.push("", `Estimated annual benefit: ${totalAnnualBenefit > 0 ? formatRupees(totalAnnualBenefit) : "-"}`);
  lines.push("");

  if (matches.length === 0) {
    lines.push("No matched schemes or jobs yet.");
  } else {
    lines.push("*Matches*");
    matches.slice(0, shown).forEach((m, i) => {
      lines.push(`${i + 1}. *${m.title}* (${m.kind})`);
      lines.push(`   Benefit: ${benefitLine(m.benefitText, m.benefitAmount)}`);
      const deadline = deadlineText(m.deadline, m.daysLeft);
      if (deadline) lines.push(`   ${deadline}`);
    });
    if (shown < matches.length) lines.push(`...and ${matches.length - shown} more`);
  }

  const documents = Array.from(
    new Set(matches.flatMap((m) => (m.documents ?? []).map((d) => d.trim()).filter(Boolean))),
  );
  if (documents.length > 0) {
    lines.push("", "Documents to keep ready:");
    documents.forEach((d) => lines.push(`- ${d}`));
  }

  lines.push("", CLOSING_LINE);
  return lines.join("\n");
}

/**
 * Plain-text WhatsApp digest of matched schemes/jobs, total annual benefit, deadlines and documents.
 * Keeps the list short so the message stays under about 1500 characters ("...and N more").
 */
export function buildWhatsAppMessage(input: WhatsAppDigestInput): string {
  let shown = input.matches.length;
  let text = renderDigest(input, shown);
  while (text.length > MAX_MESSAGE_LENGTH && shown > 0) {
    shown -= 1;
    text = renderDigest(input, shown);
  }
  return text;
}

/** WhatsApp reminder for one scheme: title, benefit, deadline with days left, documents and official source. */
export function buildSchemeReminderMessage(scheme: Scheme): string {
  const lines: string[] = [DIGEST_HEADER, "", `*${scheme.name}* (${SCHEME_KIND_LABEL[scheme.type]})`];
  lines.push(`Benefit: ${scheme.benefitSummary}`);
  const deadline = deadlineText(scheme.last_date, daysLeft(scheme.last_date));
  if (deadline) lines.push(deadline);

  const documents = (scheme.documents ?? []).map((d) => d.trim()).filter(Boolean);
  if (documents.length > 0) {
    lines.push("", "Documents to keep ready:");
    documents.forEach((d) => lines.push(`- ${d}`));
  }

  if (scheme.officialUrl) lines.push("", `Official source: ${scheme.officialUrl}`);
  lines.push("", CLOSING_LINE);
  return lines.join("\n");
}

/**
 * Opens WhatsApp with the message prefilled. Uses the household number (with 91 country code)
 * when valid, otherwise the generic share page so the user can pick a contact.
 */
export function openWhatsAppAlert(phone: string | null | undefined, message: string): void {
  if (typeof window === "undefined") return;
  const number = normalizeIndianPhone(phone);
  const url = number
    ? `https://wa.me/91${number}?text=${encodeURIComponent(message)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
