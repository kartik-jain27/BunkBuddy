/**
 * subjects.ts — repository for subjects and their derived counts.
 */

import { randomUUID } from 'expo-crypto';

import { getDatabase } from '../client';
import {
  mapSubjectRow,
  mapSubjectWithCountsRow,
  type SubjectRow,
  type SubjectWithCountsRow,
} from '../mappers';
import type { DeleteToken, Subject, SubjectWithCounts } from '../types';
import { nowIso, placeholders, updateRow, type SqlValue } from './update';

export interface CreateSubjectInput {
  name: string;
  color: string;
  initialPresent: number;
  initialTotal: number;
}

export type SubjectPatch = Partial<
  Pick<Subject, 'name' | 'color' | 'initialPresent' | 'initialTotal'>
>;

const SUBJECT_COLUMNS = `
  id, name, color, initial_present, initial_total, sort_order, created_at, updated_at
`;

export async function listSubjectsWithCounts(): Promise<SubjectWithCounts[]> {
  const rows = await getDatabase().getAllAsync<SubjectWithCountsRow>(`
    SELECT s.id,
           s.name,
           s.color,
           s.initial_present,
           s.initial_total,
           s.sort_order,
           s.created_at,
           s.updated_at,
           s.initial_present + COALESCE(SUM(r.status = 'present'), 0) AS present,
           s.initial_total + COUNT(r.id) AS total
      FROM subjects s
      LEFT JOIN attendance_records r
             ON r.subject_id = s.id AND r.deleted_at IS NULL
     WHERE s.deleted_at IS NULL
     GROUP BY s.id
     ORDER BY s.sort_order, s.created_at, s.name
  `);

  return rows.map(mapSubjectWithCountsRow);
}

export async function createSubject(input: CreateSubjectInput): Promise<Subject> {
  const db = getDatabase();
  const id = randomUUID();
  const now = nowIso();

  await db.runAsync(
    `INSERT INTO subjects
       (id, name, color, initial_present, initial_total, sort_order, created_at, updated_at, dirty)
     VALUES (?, ?, ?, ?, ?, COALESCE((SELECT MAX(sort_order) + 1 FROM subjects), 0), ?, ?, 1)`,
    [id, input.name, input.color, input.initialPresent, input.initialTotal, now, now],
  );

  const row = await db.getFirstAsync<SubjectRow>(
    `SELECT ${SUBJECT_COLUMNS} FROM subjects WHERE id = ?`,
    id,
  );
  if (!row) {
    throw new Error('Could not read the subject that was just created.');
  }
  return mapSubjectRow(row);
}

export async function updateSubject(id: string, patch: SubjectPatch): Promise<void> {
  const fields: Record<string, SqlValue | undefined> = {
    name: patch.name,
    color: patch.color,
    initial_present: patch.initialPresent,
    initial_total: patch.initialTotal,
  };
  await updateRow('subjects', id, fields);
}

/**
 * Soft-deletes the subject, its slots and its records, and unlinks its tasks.
 * The returned token lets the UI restore exactly those rows (undo snackbar).
 */
export async function deleteSubjectCascade(id: string): Promise<DeleteToken> {
  const db = getDatabase();
  const deletedAt = nowIso();

  const token: DeleteToken = {
    subjectId: id,
    deletedAt,
    slotIds: [],
    recordIds: [],
    taskIds: [],
  };

  await db.withTransactionAsync(async () => {
    const slots = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM timetable_slots WHERE subject_id = ? AND deleted_at IS NULL',
      id,
    );
    const records = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM attendance_records WHERE subject_id = ? AND deleted_at IS NULL',
      id,
    );
    const tasks = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM tasks WHERE subject_id = ? AND deleted_at IS NULL',
      id,
    );

    token.slotIds = slots.map((row) => row.id);
    token.recordIds = records.map((row) => row.id);
    token.taskIds = tasks.map((row) => row.id);

    await db.runAsync(
      `UPDATE subjects SET deleted_at = ?, updated_at = ?, dirty = 1
        WHERE id = ? AND deleted_at IS NULL`,
      [deletedAt, deletedAt, id],
    );
    await db.runAsync(
      `UPDATE timetable_slots SET deleted_at = ?, updated_at = ?, dirty = 1
        WHERE subject_id = ? AND deleted_at IS NULL`,
      [deletedAt, deletedAt, id],
    );
    await db.runAsync(
      `UPDATE attendance_records SET deleted_at = ?, updated_at = ?, dirty = 1
        WHERE subject_id = ? AND deleted_at IS NULL`,
      [deletedAt, deletedAt, id],
    );
    await db.runAsync(
      `UPDATE tasks SET subject_id = NULL, updated_at = ?, dirty = 1
        WHERE subject_id = ? AND deleted_at IS NULL`,
      [deletedAt, id],
    );
  });

  return token;
}

/**
 * Restores a cascade delete. Only rows still soft-deleted at the token's
 * timestamp are restored; tasks get their subject back only if still unlinked.
 */
export async function restore(token: DeleteToken): Promise<void> {
  const db = getDatabase();
  const now = nowIso();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE subjects SET deleted_at = NULL, updated_at = ?, dirty = 1
        WHERE id = ? AND deleted_at = ?`,
      [now, token.subjectId, token.deletedAt],
    );

    if (token.slotIds.length > 0) {
      await db.runAsync(
        `UPDATE timetable_slots SET deleted_at = NULL, updated_at = ?, dirty = 1
          WHERE id IN (${placeholders(token.slotIds.length)}) AND deleted_at = ?`,
        [now, ...token.slotIds, token.deletedAt],
      );
    }

    if (token.recordIds.length > 0) {
      await db.runAsync(
        `UPDATE attendance_records SET deleted_at = NULL, updated_at = ?, dirty = 1
          WHERE id IN (${placeholders(token.recordIds.length)}) AND deleted_at = ?`,
        [now, ...token.recordIds, token.deletedAt],
      );
    }

    if (token.taskIds.length > 0) {
      await db.runAsync(
        `UPDATE tasks SET subject_id = ?, updated_at = ?, dirty = 1
          WHERE id IN (${placeholders(token.taskIds.length)})
            AND deleted_at IS NULL AND subject_id IS NULL`,
        [token.subjectId, now, ...token.taskIds],
      );
    }
  });
}
