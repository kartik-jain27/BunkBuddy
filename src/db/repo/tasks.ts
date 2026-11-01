/**
 * tasks.ts — repository for the assignment to-do list.
 */

import { randomUUID } from 'expo-crypto';

import { getDatabase } from '../client';
import { mapTaskRow, type TaskRow } from '../mappers';
import type { Task } from '../../lib/tasks';
import { nowIso, softDeleteRow, updateRow, type SqlValue } from './update';

export interface CreateTaskInput {
  /** Must already be normaliseTitle()'d by the caller. */
  title: string;
  dueDate: string | null;
  subjectId: string | null;
}

export type TaskPatch = Partial<Pick<Task, 'title' | 'dueDate' | 'subjectId'>>;

const TASK_COLUMNS = `
  id, title, due_date, subject_id, done, created_at, done_at
`;

export async function listTasks(): Promise<Task[]> {
  const rows = await getDatabase().getAllAsync<TaskRow>(
    `SELECT ${TASK_COLUMNS} FROM tasks
      WHERE deleted_at IS NULL
      ORDER BY (due_date IS NULL), due_date, created_at`,
  );
  return rows.map(mapTaskRow);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const id = randomUUID();
  const now = nowIso();

  await getDatabase().runAsync(
    `INSERT INTO tasks
       (id, title, due_date, subject_id, done, done_at, created_at, updated_at, dirty)
     VALUES (?, ?, ?, ?, 0, NULL, ?, ?, 1)`,
    [id, input.title, input.dueDate, input.subjectId, now, now],
  );

  return {
    id,
    title: input.title,
    dueDate: input.dueDate,
    subjectId: input.subjectId,
    done: false,
    createdAt: now,
    doneAt: null,
  };
}

export async function updateTask(id: string, patch: TaskPatch): Promise<void> {
  const fields: Record<string, SqlValue | undefined> = {
    title: patch.title,
    due_date: patch.dueDate,
    subject_id: patch.subjectId,
  };
  await updateRow('tasks', id, fields);
}

export async function toggleTask(id: string): Promise<void> {
  const now = nowIso();
  await getDatabase().runAsync(
    `UPDATE tasks
        SET done = 1 - done,
            done_at = CASE WHEN done = 0 THEN ? ELSE NULL END,
            updated_at = ?, dirty = 1
      WHERE id = ? AND deleted_at IS NULL`,
    [now, now, id],
  );
}

export async function deleteTask(id: string): Promise<void> {
  await softDeleteRow('tasks', id);
}

export async function clearDoneTasks(): Promise<void> {
  const now = nowIso();
  await getDatabase().runAsync(
    `UPDATE tasks SET deleted_at = ?, updated_at = ?, dirty = 1
      WHERE done = 1 AND deleted_at IS NULL`,
    [now, now],
  );
}
