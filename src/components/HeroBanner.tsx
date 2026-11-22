import { useMemo } from "react";
import { Link } from "react-router-dom";
import { matchHousehold } from "../engine/match";
import { useHousehold } from "../state/householdStore";
import { useSchemes } from "../state/schemeStore";

export default function HeroBanner() {
  const { members, profile } = useHousehold();
  const { schemes } = useSchemes();

  const eligibleCount = useMemo(
    () => matchHousehold(members, schemes, profile).filter((p) => p.result.eligible).length,
    [members, schemes, profile],
  );

  const title =
    eligibleCount === 0
      ? "No Active Matches Yet"
      : eligibleCount === 1
        ? "1 Active Match Ready"
        : `${eligibleCount} Active Matches Ready`;

  return (
    <section className="yr-hero">
      <div className="yr-hero-kicker">TOTAL FAMILY ELIGIBILITY</div>
      <div className="yr-hero-title">{title}</div>
      <div className="yr-hero-sub">ZERO MIDDLEMAN FEES • VERIFIED PORTALS</div>
      <Link to="/matches" className="yr-hero-pill">
        <span className="yr-dot" aria-hidden="true" />
        View All Matches »
      </Link>
    </section>
  );
}
