import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { calculateTotalEligibleBenefit, parseAnnualBenefit } from "../engine/benefit";
import { matchHousehold } from "../engine/match";
import { daysLeft } from "../engine/urgency";
import { useHousehold } from "../state/householdStore";
import { useSchemes } from "../state/schemeStore";
import type { Member } from "../types";
import { buildWhatsAppMessage, normalizeIndianPhone, openWhatsAppAlert, SCHEME_KIND_LABEL } from "../utils/whatsappAlert";
import type { WhatsAppMatchItem } from "../utils/whatsappAlert";
import MemberForm from "./MemberForm";
import "./HomePage.css";
import type { IconName, NaviIconProps } from "./NaviIcons";
import {
  ChevronRight,
  Copy,
  Heart,
  JobsExams,
  Members,
  Plus,
  QuickIcon,
  Scholarship,
  Share,
} from "./NaviIcons";

const QUICK_TILES: { label: string; to: string; name: IconName }[] = [
  { label: "Schemes", to: "/matches?filter=schemes", name: "Schemes" },
  { label: "Jobs & Exams", to: "/matches?filter=jobs", name: "JobsExams" },
  { label: "Grama One", to: "/grama-one", name: "GramaOne" },
  { label: "Applied", to: "/matches?filter=applied", name: "Applied" },
];

const EXPLORE_ROWS: {
  label: string;
  to: string;
  badge: string | null;
  Icon: ComponentType<NaviIconProps>;
}[] = [
  { label: "SSP Scholarship", to: "/matches?filter=schemes", badge: "New", Icon: Scholarship },
  { label: "KEA / KPSC Jobs", to: "/matches?filter=jobs", badge: "New", Icon: JobsExams },
  { label: "Gruhalakshmi", to: "/matches?filter=schemes", badge: "₹0 Fee", Icon: Heart },
  { label: "Family Members", to: "/members", badge: null, Icon: Members },
];

const UNSUPPORTED_MSG = "Copy not supported in this browser.";

export default function HomePage() {
  const { members, profile, phone, addMember } = useHousehold();
  const { schemes } = useSchemes();
  const [note, setNote] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  // Same eligibility rule the Matches tab uses for its count.
  const eligibleMatches = useMemo(
    () => matchHousehold(members, schemes, profile).filter((p) => p.result.eligible),
    [members, schemes, profile],
  );
  const eligibleCount = eligibleMatches.length;
  const nextMatch = eligibleMatches[0] ?? null;

  // Clears the transient copy/share message after 2 seconds.
  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(""), 2000);
    return () => window.clearTimeout(timer);
  }, [note]);

  async function copyPin() {
    const clip = typeof navigator !== "undefined" ? navigator.clipboard : undefined;
    if (!clip?.writeText) {
      setNote(UNSUPPORTED_MSG);
      return;
    }
    try {
      await clip.writeText(profile.pincode);
      setNote("PIN copied");
    } catch {
      setNote(UNSUPPORTED_MSG);
    }
  }

  async function shareApp() {
    const origin = window.location.origin;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "YojanaRadar KA", url: origin });
      } catch {
        // User dismissed the share sheet; nothing to show.
      }
      return;
    }
    const clip = typeof navigator !== "undefined" ? navigator.clipboard : undefined;
    if (!clip?.writeText) {
      setNote(UNSUPPORTED_MSG);
      return;
    }
    try {
      await clip.writeText(origin);
      setNote("Link copied");
    } catch {
      setNote(UNSUPPORTED_MSG);
    }
  }

  /** Sends one digest of eligible matches (deduplicated by scheme) to WhatsApp. */
  function sendSummaryToWhatsApp() {
    const seen = new Set<string>();
    const matches: WhatsAppMatchItem[] = [];
    for (const { scheme } of eligibleMatches) {
      if (seen.has(scheme.id)) continue;
      seen.add(scheme.id);
      const days = daysLeft(scheme.last_date);
      matches.push({
        title: scheme.name,
        kind: SCHEME_KIND_LABEL[scheme.type],
        benefitText: scheme.benefitSummary,
        benefitAmount: parseAnnualBenefit(scheme.benefitSummary),
        deadline: days === null ? null : scheme.last_date,
        daysLeft: days,
        documents: scheme.documents,
      });
    }
    const message = buildWhatsAppMessage({
      matches,
      totalAnnualBenefit: calculateTotalEligibleBenefit(eligibleMatches, schemes),
    });
    openWhatsAppAlert(phone, message);
  }

  function handleSave(data: Omit<Member, "id">) {
    addMember(data);
    setSheetOpen(false);
  }

  return (
    <div className="yr-home" style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}>
      <section className="yr-home-hero">
        <p className="yr-home-hero-caps">TOTAL FAMILY ELIGIBILITY</p>
        <h2 className="yr-home-hero-title">{eligibleCount} Active Matches Ready</h2>
        <p className="yr-home-hero-sub">ZERO MIDDLEMAN FEES • VERIFIED PORTALS</p>
        <Link to="/matches" className="yr-home-hero-cta">
          <span className="yr-home-dot" aria-hidden="true" />
          View All Matches »
        </Link>
      </section>

      <button type="button" className="yr-home-add" onClick={sendSummaryToWhatsApp}>
        Send Summary to WhatsApp
        {normalizeIndianPhone(phone) ? ` (+91 ${normalizeIndianPhone(phone)})` : ""}
      </button>

      {members.length === 0 && (
        <div className="yr-home-card">
          <h3 className="yr-home-section-title">Welcome to YojanaRadar KA</h3>
          <p className="yr-home-muted">Set up your household to see matching schemes.</p>
          <Link to="/members" className="yr-home-add">
            <Plus size={18} />
            Set up household
          </Link>
        </div>
      )}

      <button type="button" className="yr-home-add" onClick={() => setSheetOpen(true)}>
        <Plus size={18} />
        Add Family Member
      </button>

      <nav className="yr-home-quick-row" aria-label="Quick actions">
        {QUICK_TILES.map(({ label, to, name }) => (
          <Link key={label} to={to} className="yr-home-quick">
            <QuickIcon name={name} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="yr-home-utility">
        <span className="yr-home-util-text">District: {profile.district}</span>
        <span className="yr-home-util-sep" aria-hidden="true" />
        <span className="yr-home-util-text">PIN: {profile.pincode}</span>
        <button type="button" className="yr-home-util-btn" aria-label="Copy PIN code" onClick={copyPin}>
          <Copy size={18} />
        </button>
        <span className="yr-home-util-sep" aria-hidden="true" />
        <button type="button" className="yr-home-util-btn yr-home-util-share" onClick={shareApp}>
          <Share size={18} />
          Share App
        </button>
      </div>
      {note && (
        <div role="status" className="yr-home-note">
          {note}
        </div>
      )}

      <h3 className="yr-home-section-title">Next for you</h3>
      <div className="yr-home-card yr-home-next">
        {nextMatch ? (
          <div className="yr-home-next-text">
            <div className="yr-home-next-scheme">{nextMatch.scheme.name}</div>
            <div className="yr-home-next-member">
              {nextMatch.member.name} ({nextMatch.member.relationship})
            </div>
          </div>
        ) : (
          <div className="yr-home-muted">No matches yet — add a family member</div>
        )}
        <Link to="/matches" aria-label="View matches" className="yr-home-circle-btn">
          <ChevronRight size={22} />
        </Link>
      </div>

      <h3 className="yr-home-section-title">Explore Services</h3>
      <div className="yr-home-card yr-home-list">
        {EXPLORE_ROWS.map(({ label, to, badge, Icon }) => (
          <Link key={label} to={to} className="yr-home-list-row">
            <span className="yr-home-list-icon">
              <Icon size={22} />
            </span>
            <span className="yr-home-list-label">{label}</span>
            {badge && <span className="yr-home-badge">{badge}</span>}
            <span className="yr-home-list-chev">
              <ChevronRight size={20} />
            </span>
          </Link>
        ))}
      </div>

      {sheetOpen && (
        <div className="yr-home-sheet-backdrop" onClick={() => setSheetOpen(false)}>
          <div
            className="yr-home-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Add family member"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="yr-home-sheet-grab" aria-hidden="true" />
            <h3 className="yr-home-sheet-title">Add family member</h3>
            <MemberForm key="new-member" onSave={handleSave} onCancel={() => setSheetOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
