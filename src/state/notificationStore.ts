import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'yojanaradar.notifications';
const MAX_NOTIFICATIONS = 50;

export interface Notification {
  id: string;
  timestamp: string;
  message: string;
  schemeId: string;
  memberId: string;
}

export interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (message: string, schemeId: string, memberId: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

function isNotification(value: unknown): value is Notification {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.timestamp === 'string' &&
    typeof v.message === 'string' &&
    typeof v.schemeId === 'string' &&
    typeof v.memberId === 'string'
  );
}

function loadInitialNotifications(): Notification[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every(isNotification)) {
        return parsed.slice(0, MAX_NOTIFICATIONS);
      }
    }
  } catch {
    // Invalid JSON or storage unavailable: start with an empty feed.
  }
  return [];
}

function generateId(): string {
  return `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Provides the notification feed (newest first, max 50), persisted to localStorage.
 * Written with createElement so this module can stay a .ts file.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(loadInitialNotifications);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // Storage full or unavailable: keep in-memory state only.
    }
  }, [notifications]);

  const addNotification = useCallback((message: string, schemeId: string, memberId: string) => {
    const entry: Notification = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      message,
      schemeId,
      memberId,
    };
    setNotifications((prev) => [entry, ...prev].slice(0, MAX_NOTIFICATIONS));
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({ notifications, addNotification }),
    [notifications, addNotification],
  );

  return createElement(NotificationContext.Provider, { value }, children);
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (ctx === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
