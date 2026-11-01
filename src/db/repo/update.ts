/**
 * update.ts — shared write helpers for the repositories.
 *
 * SQL lives only under src/db/repo/. Column and table names come from closed
 * unions in code, never from user input; every value is parameterised.
 */

import { getDatabase } from '../client';

export type SqlValue = string | number | null;

export type SyncedTable =
  | 'subjects'
  | 'timetable_slots'
  | 'attendance_records'
  | 'tasks'
  | 'profile'
  | 'holidays';

export function nowIso(): string {
  return new Date().toISOString();
}

export function placeholders(count: number): string {
  return Array.from({ length: count }, () => '?').join(', ');
}

/**
 * Updates only the provided columns and always touches updated_at + dirty.
 * Passing undefined for a column means "leave it alone"; null clears it.
 */
export async function updateRow(
  table: SyncedTable,
  id: string,
  fields: Record<string, SqlValue | undefined>,
): Promise<void> {
  const entries: Array<[string, SqlValue]> = [];
  for (const [column, value] of Object.entries(fields)) {
    if (value !== undefined) {
      entries.push([column, value]);
    }
  }
  if (entries.length === 0) {
    return;
  }

  const assignments = entries.map(([column]) => `${column} = ?`).join(', ');
  const params: SqlValue[] = entries.map(([, value]) => value);
  params.push(nowIso(), id);

  await getDatabase().runAsync(
    `UPDATE ${table} SET ${assignments}, updated_at = ?, dirty = 1 WHERE id = ?`,
    params,
  );
}

export async function softDeleteRow(
  table: SyncedTable,
  id: string,
  deletedAt: string = nowIso(),
): Promise<void> {
  await getDatabase().runAsync(
    `UPDATE ${table}
        SET deleted_at = ?, updated_at = ?, dirty = 1
      WHERE id = ? AND deleted_at IS NULL`,
    [deletedAt, deletedAt, id],
  );
}
