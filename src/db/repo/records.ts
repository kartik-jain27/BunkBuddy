/**
 * records.ts — repository for marked classes.
 *
 * A row is one marked class. No row = the class does not exist for every
 * number in the app. Deletes are soft so they can sync and be undone.
 */

import { randomUUID } from 'expo-crypto';

import { getDatabase } from '../client';
import { mapRecordRow, type AttendanceRecordRow } from '../mappers';
import type { AttendanceRecord } from '../types';
import type { AttendanceStatus } from '../../lib/attendance';
import { nowIso, softDeleteRow } from './update';

export interface SetRecordInput {
  subjectId: string;
  slotId: string | null;
  date: string;
  status: AttendanceStatus;
}

const RECORD_COLUMNS = `
  id, subject_id, slot_id, date, status
`;

export async function listRecordsForDate(dateKey: string): Promise<AttendanceRecord[]> {
  const rows = await getDatabase().getAllAsync<AttendanceRecordRow>(
    `SELECT ${RECORD_COLUMNS} FROM attendance_records
      WHERE date = ? AND deleted_at IS NULL`,
    dateKey,
  );
  return rows.map(mapRecordRow);
}

export async function listRecordsForSubject(subjectId: string): Promise<AttendanceRecord[]> {
  const rows = await getDatabase().getAllAsync<AttendanceRecordRow>(
    `SELECT ${RECORD_COLUMNS} FROM attendance_records
      WHERE subject_id = ? AND deleted_at IS NULL
      ORDER BY date DESC, created_at DESC`,
    subjectId,
  );
  return rows.map(mapRecordRow);
}

/**
 * Upserts the live record for (slot, date) when slotId is set; otherwise
 * inserts an extra-class record. Tapping the active button again must call
 * clearRecord() instead.
 */
export async function setRecord(input: SetRecordInput): Promise<void> {
  const db = getDatabase();
  const now = nowIso();

  await db.runAsync(
    `INSERT INTO attendance_records
       (id, subject_id, slot_id, date, status, created_at, updated_at, dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)
     ON CONFLICT(slot_id, date) WHERE slot_id IS NOT NULL AND deleted_at IS NULL
     DO UPDATE SET
       status = excluded.status,
       updated_at = excluded.updated_at,
       dirty = 1`,
    [randomUUID(), input.subjectId, input.slotId, input.date, input.status, now, now],
  );
}

/** Soft delete — "tap the active button again" (undo). */
export async function clearRecord(id: string): Promise<void> {
  await softDeleteRow('attendance_records', id);
}

export async function addExtraRecord(
  subjectId: string,
  date: string,
  status: AttendanceStatus,
): Promise<void> {
  const now = nowIso();
  await getDatabase().runAsync(
    `INSERT INTO attendance_records
       (id, subject_id, slot_id, date, status, created_at, updated_at, dirty)
     VALUES (?, ?, NULL, ?, ?, ?, ?, 1)`,
    [randomUUID(), subjectId, date, status, now, now],
  );
}
