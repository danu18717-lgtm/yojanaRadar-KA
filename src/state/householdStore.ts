import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { HouseholdProfile, Member, RationCardType } from '../types';

/** Starting household profile: nothing filled in until onboarding. 'None' is the type's neutral ration card value. */
const EMPTY_PROFILE: HouseholdProfile = {
  district: '',
  pincode: '',
  rationCardType: 'None',
  anyMemberPaysIncomeTaxOrGst: false,
  ownsPuccaHouse: false,
};

/** localStorage key prefix; the household is stored under prefix + mobile number. */
export const HOUSEHOLD_KEY_PREFIX = 'yojanaradar_household_';

/** Shape of one saved household in localStorage. */
export interface SavedHousehold {
  phone: string;
  district: string;
  pincode: string;
  rationCardType: RationCardType;
  members: Member[];
  savedAt: string;
}

/** Reads the household saved under this mobile number, or null if none (or unreadable). */
export function readSavedHousehold(phone: string): SavedHousehold | null {
  try {
    const raw = window.localStorage.getItem(HOUSEHOLD_KEY_PREFIX + phone);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedHousehold;
    return Array.isArray(parsed.members) ? parsed : null;
  } catch {
    return null;
  }
}

function writeSavedHousehold(phone: string, profile: HouseholdProfile, members: Member[]): void {
  try {
    const saved: SavedHousehold = {
      phone,
      district: profile.district,
      pincode: profile.pincode,
      rationCardType: profile.rationCardType,
      members,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(HOUSEHOLD_KEY_PREFIX + phone, JSON.stringify(saved));
  } catch {
    // Storage unavailable (private mode / quota): the in-memory household still works.
  }
}

export interface HouseholdContextValue {
  members: Member[];
  addMember: (data: Omit<Member, 'id'>) => void;
  updateMember: (id: string, data: Omit<Member, 'id'>) => void;
  profile: HouseholdProfile;
  updateProfile: (patch: Partial<HouseholdProfile>) => void;
  onboardingComplete: boolean;
  setOnboardingComplete: (value: boolean) => void;
  clearHousehold: () => void;
  phone: string;
  setPhone: (value: string) => void;
  loadSavedHousehold: (saved: SavedHousehold) => void;
}

const HouseholdContext = createContext<HouseholdContextValue | undefined>(undefined);

function generateId(): string {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Provides the household member list, household profile and onboarding flag to the app. The onboarding flag is held
 * in memory only, so every page load starts from onboarding Step 1. Household data is saved to localStorage under the
 * user's mobile number whenever a store action changes it (addMember, updateMember, updateProfile, onboarding save).
 * Written with createElement so this module can stay a .ts file.
 */
export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [profile, setProfile] = useState<HouseholdProfile>(EMPTY_PROFILE);
  const [onboardingComplete, setOnboardingCompleteState] = useState<boolean>(false);
  const [phone, setPhoneState] = useState<string>('');

  // Set by store actions that change household data; the effect below writes once per change.
  const pendingSave = useRef(false);

  useEffect(() => {
    if (!pendingSave.current || phone === '') return;
    pendingSave.current = false;
    writeSavedHousehold(phone, profile, members);
  }, [phone, profile, members]);

  const addMember = useCallback((data: Omit<Member, 'id'>) => {
    const member: Member = { id: generateId(), ...data };
    pendingSave.current = true;
    setMembers((prev) => [...prev, member]);
  }, []);

  const updateMember = useCallback((id: string, data: Omit<Member, 'id'>) => {
    pendingSave.current = true;
    setMembers((prev) => prev.map((m) => (m.id === id ? { id, ...data } : m)));
  }, []);

  const updateProfile = useCallback((patch: Partial<HouseholdProfile>) => {
    // Pincode is always kept as a string.
    pendingSave.current = true;
    setProfile((prev) => ({
      ...prev,
      ...patch,
      pincode: String(patch.pincode ?? prev.pincode),
    }));
  }, []);

  const setOnboardingComplete = useCallback((value: boolean) => {
    setOnboardingCompleteState(value);
  }, []);

  const setPhone = useCallback((value: string) => {
    setPhoneState(value);
  }, []);

  /** Restores a saved household into memory and opens Home. Does not write back to storage. */
  const loadSavedHousehold = useCallback((saved: SavedHousehold) => {
    setPhoneState(saved.phone);
    setMembers(saved.members);
    setProfile({
      ...EMPTY_PROFILE,
      district: saved.district,
      pincode: saved.pincode,
      rationCardType: saved.rationCardType,
    });
    setOnboardingCompleteState(true);
  }, []);

  /**
   * Empties the household in memory, clears the phone and returns the app to onboarding. The localStorage entry for
   * the phone is left untouched.
   */
  const clearHousehold = useCallback(() => {
    setMembers([]);
    setProfile(EMPTY_PROFILE);
    setPhoneState('');
    setOnboardingCompleteState(false);
  }, []);

  const value = useMemo<HouseholdContextValue>(
    () => ({
      members,
      addMember,
      updateMember,
      profile,
      updateProfile,
      onboardingComplete,
      setOnboardingComplete,
      clearHousehold,
      phone,
      setPhone,
      loadSavedHousehold,
    }),
    [
      members,
      addMember,
      updateMember,
      profile,
      updateProfile,
      onboardingComplete,
      setOnboardingComplete,
      clearHousehold,
      phone,
      setPhone,
      loadSavedHousehold,
    ],
  );

  return createElement(HouseholdContext.Provider, { value }, children);
}

export function useHousehold(): HouseholdContextValue {
  const ctx = useContext(HouseholdContext);
  if (ctx === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return ctx;
}
