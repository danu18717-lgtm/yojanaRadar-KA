import type { Member, MatchResult, Scheme } from "../types";

/** Fixed app "today" (do not use the real clock). */
export const TODAY = "2026-11-21";
/** A scheme is urgent when its last date is within this many days (inclusive). */
export const URGENT_WINDOW_DAYS = 5;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parses a strict YYYY-MM-DD string into a UTC timestamp, or null if invalid. */
function parseYmd(value: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const t = Date.UTC(y, mo - 1, d);
  const check = new Date(t);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) {
    return null;
  }
  return t;
}

/**
 * Whole days from `today` to `lastDate`. Returns null for "Ongoing" or any
 * unparseable value. Uses UTC so there is no timezone drift.
 */
export function daysLeft(lastDate: string, today: string = TODAY): number | null {
  const end = parseYmd(lastDate);
  const start = parseYmd(today);
  if (end === null || start === null) return null;
  return Math.round((end - start) / MS_PER_DAY);
}

/** True when the scheme's last date is 0..URGENT_WINDOW_DAYS days away (inclusive). */
export function isUrgent(scheme: Scheme, today: string = TODAY): boolean {
  const d = daysLeft(scheme.last_date, today);
  return d !== null && d >= 0 && d <= URGENT_WINDOW_DAYS;
}

export interface UrgentItem {
  memberId: string;
  memberName: string;
  relationship: string;
  scheme: Scheme;
  daysLeft: number;
}

/**
 * Returns eligible, urgent, still-PENDING member/scheme pairs, sorted by
 * days left ascending, then member name.
 */
export function findUrgentPending(
  pairs: { member: Member; scheme: Scheme; result: MatchResult }[],
  statusOf: (memberId: string, schemeId: string) => string,
  today: string = TODAY,
): UrgentItem[] {
  const items: UrgentItem[] = [];
  for (const { member, scheme, result } of pairs) {
    if (!result.eligible) continue;
    if (!isUrgent(scheme, today)) continue;
    if (statusOf(member.id, scheme.id) !== "PENDING") continue;
    const d = daysLeft(scheme.last_date, today);
    if (d === null) continue;
    items.push({
      memberId: member.id,
      memberName: member.name,
      relationship: member.relationship,
      scheme,
      daysLeft: d,
    });
  }
  return items.sort((a, b) => a.daysLeft - b.daysLeft || a.memberName.localeCompare(b.memberName));
}
