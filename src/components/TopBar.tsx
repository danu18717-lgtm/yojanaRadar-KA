import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculateTotalEligibleBenefit, formatEligibleBenefit } from "../engine/benefit";
import { matchHousehold } from "../engine/match";
import { findUrgentPending } from "../engine/urgency";
import { useHousehold } from "../state/householdStore";
import { useSchemes } from "../state/schemeStore";
import { useTracker } from "../state/trackerStore";
import { Bell, Sparkle } from "./NaviIcons";
import PlansModal from "./PlansModal";
import ProfileModal from "./ProfileModal";
import { URGENT_PREVIEW_EVENT } from "./UrgentPopupHost";


export default function TopBar() {
  const { members, profile } = useHousehold();
  const { schemes } = useSchemes();
  const { statusOf } = useTracker();
  const [plansOpen, setPlansOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const pairs = useMemo(() => matchHousehold(members, schemes, profile), [members, schemes, profile]);
  const urgentCount = useMemo(() => findUrgentPending(pairs, statusOf).length, [pairs, statusOf]);
  const totalBenefit = useMemo(() => calculateTotalEligibleBenefit(pairs, schemes), [pairs, schemes]);

  const anchor = members.find((m) => m.relationship === "Self" || m.relationship === "Head") ?? members[0];
  const initial = anchor?.name.trim().charAt(0).toUpperCase() || "YR";

  return (
    <header className="yr-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <button
          type="button"
          className="yr-avatar yr-avatar-btn"
          aria-label="Open Household Profile"
          onClick={() => setProfileOpen(true)}
        >
          {initial}
        </button>
        <strong style={{ color: "var(--plum)", fontSize: 15, whiteSpace: "nowrap" }}>YojanaRadar KA</strong>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <button
          type="button"
          className="yr-pill"
          onClick={() => navigate("/matches")}
          style={{ minHeight: 32, fontSize: 12 }}
        >
          {formatEligibleBenefit(totalBenefit)}
        </button>
        <button
          type="button"
          className="yr-pill"
          onClick={() => setPlansOpen(true)}
          style={{ minHeight: 32, fontSize: 12, color: "var(--plum)", display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <Sparkle size={14} />
          Pro
        </button>
        <button
          type="button"
          aria-label="Urgent deadline alerts"
          onClick={() => window.dispatchEvent(new CustomEvent(URGENT_PREVIEW_EVENT))}
          style={{
            position: "relative",
            minWidth: 44,
            minHeight: 44,
            border: 0,
            background: "none",
            fontSize: 20,
            cursor: "pointer",
            padding: 0,
          }}
        >
          <Bell size={22} active={urgentCount > 0} tone="dark" />
          {urgentCount > 0 && (
            <span className="yr-count-badge" style={{ top: 2, left: 24 }}>
              {urgentCount}
            </span>
          )}
        </button>
      </div>
      {plansOpen && <PlansModal onClose={() => setPlansOpen(false)} />}
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </header>
  );
}
