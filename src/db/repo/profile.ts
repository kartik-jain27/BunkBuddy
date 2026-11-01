/**
 * profile.ts — repository for the single local profile row (id = 'me').
 */

import { getDatabase } from '../client';
import { mapProfileRow, type ProfileRow } from '../mappers';
import type { Profile } from '../types';
import { nowIso, updateRow, type SqlValue } from './update';

export type ProfilePatch = Partial<
  Pick<Profile, 'displayName' | 'targetPct' | 'semesterStart' | 'semesterEnd' | 'onboarded'>
>;

const PROFILE_COLUMNS = `
  id, display_name, target_pct, semester_start, semester_end, onboarded
`;

/**
 * Returns the local profile, creating the singleton row on first read so the
 * app always has the locked default target of 75 and onboarded = 0.
 */
export async function getProfile(): Promise<Profile> {
  const db = getDatabase();

  await db.runAsync(
    `INSERT OR IGNORE INTO profile (id, target_pct, onboarded, updated_at, dirty)
     VALUES ('me', 75, 0, ?, 1)`,
    [nowIso()],
  );

  const row = await db.getFirstAsync<ProfileRow>(
    `SELECT ${PROFILE_COLUMNS} FROM profile WHERE id = 'me'`,
  );
  if (!row) {
    throw new Error('Could not read the local profile.');
  }
  return mapProfileRow(row);
}

export async function updateProfile(patch: ProfilePatch): Promise<void> {
  const fields: Record<string, SqlValue | undefined> = {
    display_name: patch.displayName,
    target_pct: patch.targetPct,
    semester_start: patch.semesterStart,
    semester_end: patch.semesterEnd,
    onboarded: patch.onboarded === undefined ? undefined : patch.onboarded ? 1 : 0,
  };
  await updateRow('profile', 'me', fields);
}
