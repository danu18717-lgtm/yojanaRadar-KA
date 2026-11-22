import type { CSSProperties, ReactNode } from "react";
import { daysLeft } from "../engine/urgency";
import { useHousehold } from "../state/householdStore";
import type { Member, MatchResult, Scheme, SchemeType } from "../types";
import { buildSchemeReminderMessage, openWhatsAppAlert } from "../utils/whatsappAlert";

export interface SchemeMatchCardProps {
  item: { member: Member; scheme: Scheme; result: MatchResult };
  onApply: (scheme: Scheme, member: Member) => void;
  /** Optional extra content rendered at the bottom of the card (e.g. tracking buttons). */
  footer?: ReactNode;
}

export const SCHEME_TYPE_LABEL: Record<SchemeType, string> = {
  SCHEME: "Welfare Scheme",
  GOVT_JOB: "Govt Job",
  EXAM: "Exam",
};

/** Human-readable last date line; "Ongoing" and closed dates are handled explicitly. */
export function lastDateText(lastDate: string): string {
  if (lastDate === "Ongoing") return "Last Date: Ongoing";
  const d = daysLeft(lastDate);
  if (d === null) return `Last Date to Apply: ${lastDate}`;
  if (d < 0) return `Last Date to Apply: ${lastDate} (Closed)`;
  return `Last Date to Apply: ${lastDate} (${d} days left)`;
}

const reasonListStyle: CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: "0.5rem 0",
  display: "flex",
  flexWrap: "wrap",
  gap: "0.4rem",
};

function reasonTagStyle(passed: boolean): CSSProperties {
  return {
    display: "inline-block",
    padding: "0.2rem 0.6rem",
    borderRadius: 999,
    fontSize: "0.8rem",
    lineHeight: 1.4,
    background: passed ? "#E6F7EF" : "#FEE2E2",
    color: passed ? "#1E6B34" : "#B00020",
  };
}

export default function SchemeMatchCard({ item, onApply, footer }: SchemeMatchCardProps) {
  const { member, scheme, result } = item;
  const { phone } = useHousehold();

  if (!result.eligible) {
    return null;
  }

  return (
    <article className="yr-card">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
        <span className="yr-badge-eligible">Likely Eligible</span>
        <span className="yr-badge-type">{SCHEME_TYPE_LABEL[scheme.type]}</span>
      </div>

      <p style={{ margin: "0.6rem 0 0.2rem" }}>
        <strong>{member.name}</strong> ({member.relationship})
      </p>

      <h3 style={{ margin: "0.2rem 0", fontWeight: 700 }}>{scheme.name}</h3>
      <p style={{ margin: "0.25rem 0" }}>{scheme.benefitSummary}</p>

      {result.reasons.length > 0 && (
        <ul style={reasonListStyle}>
          {result.reasons.map((r, i) => (
            <li key={`${r.criterion}-${i}`} style={{ listStyle: "none" }}>
              <span
                aria-label={r.passed ? "passed" : "failed"}
                title={`Expected: ${r.expected}`}
                style={reasonTagStyle(r.passed)}
              >
                {r.passed ? "Pass: " : "Fail: "}
                {r.criterion}: {r.actual}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="yr-hint" style={{ margin: "0.5rem 0 0.25rem" }}>
        Official portal:{" "}
        <a href={scheme.officialUrl} target="_blank" rel="noopener noreferrer" style={{ wordBreak: "break-all" }}>
          {scheme.officialUrl}
        </a>
      </p>
      <p className="yr-hint" style={{ margin: "0 0 0.5rem" }}>
        Last Verified: {scheme.lastVerified}
      </p>

      <p style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", fontWeight: 600 }}>{lastDateText(scheme.last_date)}</p>

      <button type="button" className="yr-btn-primary yr-btn-full" onClick={() => onApply(scheme, member)}>
        Check Documents &amp; Apply
      </button>

      <button
        type="button"
        className="yr-btn-secondary yr-btn-full"
        style={{ marginTop: "0.5rem" }}
        onClick={() => openWhatsAppAlert(phone, buildSchemeReminderMessage(scheme))}
      >
        Send Deadline Reminder on WhatsApp
      </button>

      {footer}
    </article>
  );
}
