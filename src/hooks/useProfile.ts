/**
 * useProfile.ts — the single local profile (global target, semester, onboarding).
 */

import { useCallback, useEffect, useState } from 'react';

import { useDatabase } from '../db/DatabaseProvider';
import {
  getProfile,
  updateProfile as updateProfileRecord,
  type ProfilePatch,
} from '../db/repo/profile';
import type { Profile } from '../db/types';

export interface UseProfileResult {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
}

export function useProfile(): UseProfileResult {
  const db = useDatabase();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const row = await getProfile();
      setProfile(row);
      setError(null);
    } catch {
      setError("Couldn't load your profile.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getProfile()
      .then((row) => {
        if (cancelled) return;
        setProfile(row);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [db]);

  const updateProfile = useCallback(
    async (patch: ProfilePatch): Promise<void> => {
      try {
        await updateProfileRecord(patch);
        await load();
      } catch (caught) {
        setError("Couldn't save your profile. Try again.");
        throw caught;
      }
    },
    [load],
  );

  return { profile, loading, error, refresh: load, updateProfile };
}
