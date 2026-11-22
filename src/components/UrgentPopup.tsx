import type { CSSProperties } from "react";
import type { UrgentItem } from "../engine/urgency";

export interface UrgentPopupProps {
  item: UrgentItem;
  onApplied: () => void;
  onNotApplied: () => void;
  onNotInterested: () => void;
  /** Optional 1-based position in the pending queue, e.g. { index: 1, total: 3 } shows "1 of 3". */
  position?: { index: number; total: number };
}

const iconBadgeBase: CSSProperties = {
  width: 44,
  height: 44,
  minWidth: 44,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 22,
};

const actionButtonStyle: CSSProperties = {
  minHeight: 40,
  borderRadius: 10,
  padding: "0 14px",
  width: "auto",
  flex: 1,
};

const appliedButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background: "#230833",
  color: "#fff",
};

const closeButtonStyle: CSSProperties = {
  flexShrink: 0,
  background: "none",
  border: "none",
  padding: 4,
  minHeight: 32,
  minWidth: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#6B7280",
  cursor: "pointer",
};

const TYPE_EMOJI: Record<UrgentItem["scheme"]["type"], string> = {
  SCHEME: "🏛",
  GOVT_JOB: "💼",
  EXAM: "📝",
};

export default function UrgentPopup({
  item,
  onApplied,
  onNotApplied,
  onNotInterested,
  position,
}: UrgentPopupProps) {
  const isScheme = item.scheme.type === "SCHEME";
  const closesText =
    item.daysLeft === 0 ? "Closes today" : `Closes in ${item.daysLeft} days (${item.scheme.last_date})`;

  return (
    <div className="yr-nudge" role="alert" aria-live="polite">
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Top row: icon, title, close */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div
            aria-hidden="true"
            style={{ ...iconBadgeBase, background: isScheme ? "#EEF2FF" : "#E6F7EF" }}
          >
            {TYPE_EMOJI[item.scheme.type]}
          </div>

          <p
            style={{
              flex: 1,
              minWidth: 0,
              margin: 0,
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {`${item.memberName} • ${item.scheme.name}`}
          </p>

          <button type="button" aria-label="Not Interested" onClick={onNotInterested} style={closeButtonStyle}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Middle row: deadline and counter */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span className="yr-danger-text" style={{ fontWeight: 700, minWidth: 0 }}>
            {closesText}
          </span>
          {position && position.total > 1 && (
            <span className="yr-pill">{`${position.index} of ${position.total}`}</span>
          )}
        </div>

        {/* Bottom row: actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="yr-btn-primary" onClick={onApplied} style={appliedButtonStyle}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 22 22"
              aria-hidden="true"
              focusable="false"
              style={{ marginRight: 6, verticalAlign: "middle" }}
            >
              <polyline
                points="5 11.5 9.5 16 17 7.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Applied
          </button>
          <button type="button" className="yr-btn-secondary" onClick={onNotApplied} style={actionButtonStyle}>
            Not Applied
          </button>
        </div>
      </div>
    </div>
  );
}
