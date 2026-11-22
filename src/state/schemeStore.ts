import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Scheme } from "../types";
import { schemes as seedSchemes } from "../data/seed";

const STORAGE_KEY = "yojanaradar.schemes";

export interface SchemeContextValue {
  schemes: Scheme[];
  updateScheme: (id: string, patch: Partial<Scheme>) => void;
  addScheme: (scheme: Scheme) => void;
}

const SchemeContext = createContext<SchemeContextValue | undefined>(undefined);

function isScheme(value: unknown): value is Scheme {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.rules === "object" &&
    v.rules !== null
  );
}

/** Fills `type` and `last_date` for schemes stored before those fields existed. */
function normaliseScheme(scheme: Scheme): Scheme {
  const partial = scheme as Partial<Scheme>;
  const seed = seedSchemes.find((s) => s.id === scheme.id);
  return {
    ...scheme,
    type: partial.type ?? "SCHEME",
    last_date: partial.last_date ?? seed?.last_date ?? "Ongoing",
  };
}

function loadInitialSchemes(): Scheme[] {
  let stored: Scheme[] | null = null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every(isScheme)) {
        stored = (parsed as Scheme[]).map(normaliseScheme);
      }
    }
  } catch {
    // Invalid JSON or storage unavailable: fall back to seed data.
  }
  if (stored === null) {
    return seedSchemes;
  }
  // Append seed schemes that are missing from the stored list (e.g. newly added seed entries).
  const storedIds = new Set(stored.map((s) => s.id));
  const missing = seedSchemes.filter((s) => !storedIds.has(s.id));
  return [...stored, ...missing];
}

/**
 * Provides the editable scheme list (seeded from data/seed.ts), persisted to localStorage.
 * Written with createElement so this module can stay a .ts file.
 */
export function SchemeProvider({ children }: { children: ReactNode }) {
  const [schemes, setSchemes] = useState<Scheme[]>(loadInitialSchemes);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(schemes));
    } catch {
      // Storage full or unavailable: keep in-memory state only.
    }
  }, [schemes]);

  const updateScheme = useCallback((id: string, patch: Partial<Scheme>) => {
    setSchemes((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch, id: s.id } : s)));
  }, []);

  const addScheme = useCallback((scheme: Scheme) => {
    setSchemes((prev) => [...prev, scheme]);
  }, []);

  const value = useMemo<SchemeContextValue>(
    () => ({ schemes, updateScheme, addScheme }),
    [schemes, updateScheme, addScheme],
  );

  return createElement(SchemeContext.Provider, { value }, children);
}

export function useSchemes(): SchemeContextValue {
  const ctx = useContext(SchemeContext);
  if (ctx === undefined) {
    throw new Error("useSchemes must be used within a SchemeProvider");
  }
  return ctx;
}
