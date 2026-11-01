/**
 * holidays.ts — repository for no-class days (semester projection).
 */

import { randomUUID } from 'expo-crypto';

import { getDatabase } from '../client';
import { mapHolidayRow, type HolidayRow } from '../mappers';
import type { Holiday } from '../types';
import { nowIso, softDeleteRow } from './update';

const HOLIDAY_COLUMNS = `
  id, date, label
`;

export async function listHolidays(): Promise<Holiday[]> {
  const rows = await getDatabase().getAllAsync<HolidayRow>(
    `SELECT ${HOLIDAY_COLUMNS} FROM holidays
      WHERE deleted_at IS NULL
      ORDER BY date`,
  );
  return rows.map(mapHolidayRow);
}

export async function addHoliday(date: string, label?: string | null): Promise<void> {
  const now = nowIso();
  await getDatabase().runAsync(
    `INSERT INTO holidays
       (id, date, label, created_at, updated_at, dirty)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [randomUUID(), date, label ?? null, now, now],
  );
}

export async function removeHoliday(id: string): Promise<void> {
  await softDeleteRow('holidays', id);
}
