import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type TrackStatus = "PENDING" | "APPLIED" | "NOT_APPLIED" | "NOT_INTERESTED";
type StoredStatus = "PENDING" | "APPLIED" | "NOT_INTERESTED";
type StatusMap = Record<string, StoredStatus>;

const STORAGE_KEY = "yojanaradar.tracker";
const VALID: StoredStatus[] = ["PENDING", "APPLIED", "NOT_INTERESTED"];

function keyOf(memberId: string, schemeId: string): string {
  return `${memberId}|${schemeId}`;
}

/** Loads the tracker map defensively; any invalid data yields {}. */
function loadMap(): StatusMap {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: StatusMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string" && (VALID as string[]).includes(v)) {
        out[k] = v as StoredStatus;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export interface TrackerContextValue {
  /** Returns the stored status; a missing key means PENDING. */
  statusOf: (memberId: string, schemeId: string) => string;
  setStatus: (memberId: string, schemeId: string, status: StoredStatus) => void;
  isApplied: (memberId: string, schemeId: string) => boolean;
}

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function TrackerProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<StatusMap>(loadMap);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
      // Storage unavailable or full; keep in-memory state only.
    }
  }, [map]);

  const statusOf = useCallback(
    (memberId: string, schemeId: string): string => map[keyOf(memberId, schemeId)] ?? "PENDING",
    [map],
  );

  const setStatus = useCallback((memberId: string, schemeId: string, status: StoredStatus) => {
    setMap((prev) => ({ ...prev, [keyOf(memberId, schemeId)]: status }));
  }, []);

  const isApplied = useCallback(
    (memberId: string, schemeId: string): boolean => map[keyOf(memberId, schemeId)] === "APPLIED",
    [map],
  );

  const value = useMemo(
    () => ({ statusOf, setStatus, isApplied }),
    [statusOf, setStatus, isApplied],
  );

  return createElement(TrackerContext.Provider, { value }, children);
}

export function useTracker(): TrackerContextValue {
  const ctx = useContext(TrackerContext);
  if (!ctx) {
    throw new Error("useTracker must be used inside a TrackerProvider");
  }
  return ctx;
}
