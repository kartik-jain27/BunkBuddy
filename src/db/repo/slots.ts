/**
 * slots.ts — repository for the recurring weekly timetable.
 */

import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabase } from '../client';
import { mapSlotRow, type SlotRow } from '../mappers';
import type { NewSubject } from '../types';
import type { Slot, SlotDraft } from '../../lib/timetable';
import { nowIso, softDeleteRow, updateRow, type SqlValue } from './update';

export type SlotPatch = Partial<SlotDraft>;

const SLOT_COLUMNS = `
  id, subject_id, weekday, start_time, end_time, room
`;

async function insertSlot(db: SQLiteDatabase, draft: SlotDraft, now: string): Promise<Slot> {
  const id = randomUUID();
  await db.runAsync(
    `INSERT INTO timetable_slots
       (id, subject_id, weekday, start_time, end_time, room, created_at, updated_at, dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [id, draft.subjectId, draft.weekday, draft.start, draft.end, draft.room ?? null, now, now],
  );
  return {
    id,
    subjectId: draft.subjectId,
    weekday: draft.weekday,
    start: draft.start,
    end: draft.end,
    room: draft.room ?? null,
  };
}

export async function listSlots(): Promise<Slot[]> {
  const rows = await getDatabase().getAllAsync<SlotRow>(
    `SELECT ${SLOT_COLUMNS} FROM timetable_slots
      WHERE deleted_at IS NULL
      ORDER BY weekday, start_time, end_time`,
  );
  return rows.map(mapSlotRow);
}

/** Creates every draft in one transaction and returns the created slots. */
export async function createSlots(drafts: SlotDraft[]): Promise<Slot[]> {
  const db = getDatabase();
  const now = nowIso();
  const created: Slot[] = [];

  await db.withTransactionAsync(async () => {
    for (const draft of drafts) {
      created.push(await insertSlot(db, draft, now));
    }
  });

  return created;
}

export async function updateSlot(id: string, patch: SlotPatch): Promise<void> {
  const fields: Record<string, SqlValue | undefined> = {
    subject_id: patch.subjectId,
    weekday: patch.weekday,
    start_time: patch.start,
    end_time: patch.end,
    room: patch.room,
  };
  await updateRow('timetable_slots', id, fields);
}

/**
 * Soft-deletes the slot only. Past attendance records stay live and keep
 * counting, as required by the product spec.
 */
export async function deleteSlot(id: string): Promise<void> {
  await softDeleteRow('timetable_slots', id);
}

/**
 * Timetable scan "Replace": soft-deletes all live slots, creates the new
 * subjects, then creates the scanned slots — all in one transaction.
 */
export async function replaceAllSlots(
  drafts: SlotDraft[],
  newSubjects: NewSubject[],
): Promise<void> {
  const db = getDatabase();
  const now = nowIso();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE timetable_slots SET deleted_at = ?, updated_at = ?, dirty = 1
        WHERE deleted_at IS NULL`,
      [now, now],
    );

    const nextRow = await db.getFirstAsync<{ next: number }>(
      'SELECT COALESCE(MAX(sort_order) + 1, 0) AS next FROM subjects',
    );
    const baseSortOrder = nextRow?.next ?? 0;

    for (const [index, subject] of newSubjects.entries()) {
      await db.runAsync(
        `INSERT INTO subjects
           (id, name, color, initial_present, initial_total, sort_order, created_at, updated_at, dirty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          subject.id,
          subject.name,
          subject.color,
          subject.initialPresent ?? 0,
          subject.initialTotal ?? 0,
          baseSortOrder + index,
          now,
          now,
        ],
      );
    }

    for (const draft of drafts) {
      await insertSlot(db, draft, now);
    }
  });
}
