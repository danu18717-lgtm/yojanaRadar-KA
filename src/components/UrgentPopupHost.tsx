import { useEffect, useMemo, useRef, useState } from "react";
import { matchHousehold } from "../engine/match";
import { findUrgentPending, type UrgentItem } from "../engine/urgency";
import { useHousehold } from "../state/householdStore";
import { useSchemes } from "../state/schemeStore";
import { useTracker } from "../state/trackerStore";
import type { Member } from "../types";
import UrgentPopup from "./UrgentPopup";

/** Window event the navbar dispatches to open every urgent pending item. */
export const URGENT_PREVIEW_EVENT = "yojanaradar:urgent-preview";

function sameItem(a: UrgentItem, b: UrgentItem): boolean {
  return a.memberId === b.memberId && a.scheme.id === b.scheme.id;
}

export default function UrgentPopupHost() {
  const { members, profile } = useHousehold();
  const { schemes } = useSchemes();
  const { statusOf, setStatus } = useTracker();
  const [queue, setQueue] = useState<UrgentItem[]>([]);

  const pairs = useMemo(() => matchHousehold(members, schemes, profile), [members, schemes, profile]);
  const urgentPending = useMemo(() => findUrgentPending(pairs, statusOf), [pairs, statusOf]);

  // Tracks the members array already processed, so the same render never queues twice.
  const lastMembersRef = useRef<Member[] | null>(null);

  // Open the queue on mount and whenever the household is saved (members identity changes).
  useEffect(() => {
    if (lastMembersRef.current === members) return;
    lastMembersRef.current = members;
    setQueue(urgentPending);
  }, [members, urgentPending]);

  // Navbar "Preview Urgent Popups": load ALL urgent pending items.
  useEffect(() => {
    const onPreview = () => setQueue(urgentPending);
    window.addEventListener(URGENT_PREVIEW_EVENT, onPreview);
    return () => window.removeEventListener(URGENT_PREVIEW_EVENT, onPreview);
  }, [urgentPending]);

  // Only items that are still PENDING are shown.
  const current = queue.find((item) => statusOf(item.memberId, item.scheme.id) === "PENDING");

  const removeCurrent = (item: UrgentItem) => {
    setQueue((q) => q.filter((x) => !sameItem(x, item)));
  };

  if (!current) {
    return null;
  }

  // Position among still-pending items (1-based), so the nudge can show "1 of N".
  const pendingQueue = queue.filter((item) => statusOf(item.memberId, item.scheme.id) === "PENDING");
  const position = { index: pendingQueue.indexOf(current) + 1, total: pendingQueue.length };

  return (
    <UrgentPopup
      key={`${current.memberId}|${current.scheme.id}`}
      item={current}
      position={position}
      onApplied={() => {
        setStatus(current.memberId, current.scheme.id, "APPLIED");
        removeCurrent(current);
      }}
      onNotApplied={() => {
        // Status stays PENDING so the item reappears on the next app entry.
        removeCurrent(current);
      }}
      onNotInterested={() => {
        setStatus(current.memberId, current.scheme.id, "NOT_INTERESTED");
        removeCurrent(current);
      }}
    />
  );
}
