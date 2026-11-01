/**
 * tasks.ts — pure logic for the task page and the "due soon" strip on Home.
 *
 * Product rules (locked):
 *  - A task is: title, optional due date, optional subject, done toggle.
 *  - No projects, tags, subtasks, priorities or reminders-per-task in v1.
 *  - No exam countdown (removed).
 */

import { addDays } from './dates';

export interface Task {
  id: string;
  title: string;
  /** 'YYYY-MM-DD' or null when the student did not set a due date */
  dueDate: string | null;
  subjectId: string | null;
  done: boolean;
  /** ISO timestamp (UTC) */
  createdAt: string;
  /** ISO timestamp (UTC) or null */
  doneAt: string | null;
}

export const MAX_TITLE_LENGTH = 200;

/**
 * Clean text from the quick-add input.
 * Returns null when there is nothing to save (empty / whitespace only),
 * so the caller can simply ignore the submit and keep the input open.
 */
export function normalizeTitle(raw: string): string | null {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (cleaned.length === 0) return null;
  return cleaned.length > MAX_TITLE_LENGTH ? cleaned.slice(0, MAX_TITLE_LENGTH).trim() : cleaned;
}

export type TaskGroupKey = 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'noDate' | 'done';

export const TASK_GROUP_ORDER: ReadonlyArray<TaskGroupKey> = [
  'overdue',
  'today',
  'tomorrow',
  'upcoming',
  'noDate',
  'done',
];

export const TASK_GROUP_LABELS: Record<TaskGroupKey, string> = {
  overdue: 'Overdue',
  today: 'Today',
  tomorrow: 'Tomorrow',
  upcoming: 'Upcoming',
  noDate: 'No date',
  done: 'Done',
};

function byDueThenCreated(a: Task, b: Task): number {
  const ad = a.dueDate ?? '9999-99-99';
  const bd = b.dueDate ?? '9999-99-99';
  if (ad !== bd) return ad < bd ? -1 : 1;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return 0;
}

/** Split tasks into display groups. Every group key is always present (possibly empty). */
export function groupTasks(
  tasks: ReadonlyArray<Task>,
  todayKey: string,
): Record<TaskGroupKey, Task[]> {
  const tomorrowKey = addDays(todayKey, 1);
  const groups: Record<TaskGroupKey, Task[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    upcoming: [],
    noDate: [],
    done: [],
  };

  for (const t of tasks) {
    if (t.done) groups.done.push(t);
    else if (t.dueDate === null) groups.noDate.push(t);
    else if (t.dueDate < todayKey) groups.overdue.push(t);
    else if (t.dueDate === todayKey) groups.today.push(t);
    else if (t.dueDate === tomorrowKey) groups.tomorrow.push(t);
    else groups.upcoming.push(t);
  }

  groups.overdue.sort(byDueThenCreated);
  groups.today.sort(byDueThenCreated);
  groups.tomorrow.sort(byDueThenCreated);
  groups.upcoming.sort(byDueThenCreated);
  groups.noDate.sort(byDueThenCreated);
  // most recently completed first
  groups.done.sort((a, b) => {
    const ad = a.doneAt ?? a.createdAt;
    const bd = b.doneAt ?? b.createdAt;
    return ad < bd ? 1 : ad > bd ? -1 : 0;
  });

  return groups;
}

/** Tasks still to do that are overdue, due today or due tomorrow — for the Home strip. */
export function dueSoon(tasks: ReadonlyArray<Task>, todayKey: string): Task[] {
  const g = groupTasks(tasks, todayKey);
  return [...g.overdue, ...g.today, ...g.tomorrow];
}
