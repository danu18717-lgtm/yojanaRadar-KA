import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { matchHousehold } from "../engine/match";
import { useHousehold } from "../state/householdStore";
import { useSchemes } from "../state/schemeStore";
import { Home, Matches, Members, ReferIcon, Watcher } from "./NaviIcons";

const TABS = [
  { label: "Home", to: "/", end: true, icon: Home },
  { label: "Matches", to: "/matches", end: false, icon: Matches },
  { label: "Watcher", to: "/admin/schemes", end: false, icon: Watcher },
  { label: "Members", to: "/members", end: false, icon: Members },
  { label: "Refer", to: "/refer", end: false, icon: ReferIcon },
] as const;

export default function BottomNav() {
  const { members, profile } = useHousehold();
  const { schemes } = useSchemes();

  const eligibleCount = useMemo(
    () => matchHousehold(members, schemes, profile).filter((p) => p.result.eligible).length,
    [members, schemes, profile],
  );

  return (
    <nav className="yr-bottom-nav" aria-label="Main">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => (isActive ? "yr-bottom-tab yr-bottom-tab-active" : "yr-bottom-tab")}
          >
            {({ isActive }) => (
              <>
                <span className="yr-tab-icon" aria-hidden="true">
                  <Icon size={22} active={isActive} tone={isActive ? "dark" : "muted"} />
                </span>
                <span>{tab.label}</span>
                {tab.label === "Matches" && eligibleCount > 0 && (
                  <span className="yr-count-badge">{eligibleCount}</span>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
