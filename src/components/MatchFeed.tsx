import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { matchHousehold } from "../engine/match";

import { useHousehold } from "../state/householdStore";
import { useNotifications } from "../state/notificationStore";
import { useSchemes } from "../state/schemeStore";
import { useTracker } from "../state/trackerStore";
import type { Member, Scheme } from "../types";
import ActionDrawer from "./ActionDrawer";
import SchemeMatchCard from "./SchemeMatchCard";

const sectionStyle: CSSProperties = { marginTop: "1.25rem" };

const trackButtonRowStyle: CSSProperties = { display: "flex", gap: "0.5rem", flexWrap: "wrap" };

type FilterKey = "ALL" | "SCHEMES" | "JOBS_EXAMS" | "APPLIED";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "SCHEMES", label: "Welfare Schemes" },
  { key: "JOBS_EXAMS", label: "Govt Jobs & Exams" },
  { key: "APPLIED", label: "Applied / Tracked" },
];

function filterFromParam(raw: string | null): FilterKey {
  switch (raw) {
    case "schemes":
      return "SCHEMES";
    case "jobs":
      return "JOBS_EXAMS";
    case "applied":
      return "APPLIED";
    default:
      return "ALL";
  }
}

export default function MatchFeed() {
  const { members, profile } = useHousehold();
  const { schemes } = useSchemes();
  const { notifications, addNotification } = useNotifications();
  const { statusOf, setStatus, isApplied } = useTracker();
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState<{ scheme: Scheme; member: Member } | null>(null);
  const rawFilter = searchParams.get("filter");
  const [filter, setFilter] = useState<FilterKey>(() => filterFromParam(rawFilter));

  // Re-sync the tab if the URL's ?filter= changes while this page is mounted.
  useEffect(() => {
    setFilter(filterFromParam(rawFilter));
  }, [rawFilter]);

  const matches = useMemo(
    () => matchHousehold(members, schemes, profile).filter((x) => x.result.eligible),
    [members, schemes, profile],
  );

  const visible = useMemo(() => {
    switch (filter) {
      case "SCHEMES":
        return matches.filter((x) => x.scheme.type === "SCHEME");
      case "JOBS_EXAMS":
        return matches.filter((x) => x.scheme.type === "GOVT_JOB" || x.scheme.type === "EXAM");
      case "APPLIED":
        return matches.filter((x) => isApplied(x.member.id, x.scheme.id));
      default:
        return matches;
    }
  }, [matches, filter, isApplied]);

  // Keys of eligible (member, scheme) pairs seen so far. null until the first render seeds it.
  const seenKeysRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const currentKeys = new Set(matches.map((x) => `${x.member.id}|${x.scheme.id}`));
    const previousKeys = seenKeysRef.current;

    if (previousKeys === null) {
      // First render: seed only, so existing matches do not produce notifications.
      seenKeysRef.current = currentKeys;
      return;
    }

    for (const x of matches) {
      const key = `${x.member.id}|${x.scheme.id}`;
      if (!previousKeys.has(key)) {
        addNotification(
          `${x.member.name} (${x.member.relationship}) is Likely Eligible for ${x.scheme.name}`,
          x.scheme.id,
          x.member.id,
        );
      }
    }

    seenKeysRef.current = currentKeys;
  }, [matches, addNotification]);

  return (
    <section className="yr-page">
      <h2 className="yr-section-title">Matches</h2>
      <p className="yr-hint">Likely Eligible is indicative only and not a guarantee of benefit.</p>

      <div style={sectionStyle}>
        <h3 className="yr-section-title">Notification feed</h3>
        {notifications.length === 0 ? (
          <p className="yr-hint">No notifications yet.</p>
        ) : (
          <ul style={{ paddingLeft: "1.2rem" }}>
            {notifications.map((n) => (
              <li key={n.id} style={{ marginBottom: "0.35rem" }}>
                <span className="yr-hint" style={{ marginRight: "0.5rem" }}>
                  {new Date(n.timestamp).toLocaleString()}
                </span>
                {n.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={sectionStyle}>
        <h3 className="yr-section-title">Matched schemes</h3>

        <div role="tablist" aria-label="Match filters" className="yr-pill-row" style={{ marginBottom: "0.75rem" }}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.key)}
                className={active ? "yr-pill yr-pill-active" : "yr-pill"}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {members.length === 0 ? (
          <p className="yr-hint">Add yourself and family members to discover eligible schemes & jobs</p>
        ) : visible.length === 0 ? (
          <p className="yr-hint">No Likely Eligible schemes for the current filter.</p>
        ) : (
          visible.map((item) => {
            const { member, scheme } = item;
            const status = statusOf(member.id, scheme.id);
            return (
              <SchemeMatchCard
                key={`${member.id}|${scheme.id}`}
                item={item}
                onApply={(s, m) => setSelected({ scheme: s, member: m })}
                footer={
                  <div style={{ marginTop: "0.75rem" }}>
                    <p className="yr-hint" style={{ margin: "0 0 0.5rem" }}>
                      Current status: {status}
                    </p>
                    <div style={trackButtonRowStyle}>
                      {status !== "APPLIED" && (
                        <button
                          type="button"
                          className="yr-btn-secondary"
                          onClick={() => setStatus(member.id, scheme.id, "APPLIED")}
                        >
                          Mark Applied
                        </button>
                      )}
                      {status !== "NOT_INTERESTED" && (
                        <button
                          type="button"
                          className="yr-btn-secondary"
                          onClick={() => setStatus(member.id, scheme.id, "NOT_INTERESTED")}
                        >
                          Not Interested
                        </button>
                      )}
                    </div>
                  </div>
                }
              />
            );
          })
        )}
      </div>

      {selected && (
        <ActionDrawer
          key={`${selected.member.id}|${selected.scheme.id}`}
          scheme={selected.scheme}
          member={selected.member}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
