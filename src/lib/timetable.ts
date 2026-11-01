/**
 * timetable.ts — pure timetable logic (validation, overlap detection, "what
 * classes happen on this date"). Used by both the manual editor and the
 * scan-import review screen, so there is one set of rules.
 */

import { isoWeekday, isValidTime, timeToMinutes } from './dates';

export interface Slot {
  id: string;
  subjectId: string;
  /** ISO weekday: 1 = Monday ... 7 = Sunday */
  weekday: number;
  /** 'HH:MM' 24-hour */
  start: string;
  /** 'HH:MM' 24-hour, must be after start */
  end: string;
  room?: string | null;
}

export type SlotDraft = Omit<Slot, 'id'>;

/** Returns a human-readable error message, or null when the slot is valid. */
export function validateSlot(slot: SlotDraft): string | null {
  if (!slot.subjectId) return 'Pick a subject.';
  if (!Number.isInteger(slot.weekday) || slot.weekday < 1 || slot.weekday > 7) {
    return 'Pick a day of the week.';
  }
  if (!isValidTime(slot.start)) return 'Enter a valid start time.';
  if (!isValidTime(slot.end)) return 'Enter a valid end time.';
  if (timeToMinutes(slot.end) <= timeToMinutes(slot.start)) {
    return 'End time must be after the start time.';
  }
  return null;
}

/** Two slots overlap if they share a weekday and their time ranges intersect. Touching ends do NOT overlap. */
export function slotsOverlap(a: SlotDraft, b: SlotDraft): boolean {
  if (a.weekday !== b.weekday) return false;
  return (
    timeToMinutes(a.start) < timeToMinutes(b.end) &&
    timeToMinutes(b.start) < timeToMinutes(a.end)
  );
}

/** All overlapping pairs in a list of slots. Each pair is reported once. */
export function findOverlaps(slots: ReadonlyArray<Slot>): Array<[Slot, Slot]> {
  const pairs: Array<[Slot, Slot]> = [];
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (slotsOverlap(slots[i], slots[j])) pairs.push([slots[i], slots[j]]);
    }
  }
  return pairs;
}

/** Slots that overlap a candidate (used to warn while editing). Ignores `ignoreId` (the slot being edited). */
export function conflictsWith(
  candidate: SlotDraft,
  existing: ReadonlyArray<Slot>,
  ignoreId?: string,
): Slot[] {
  return existing.filter((s) => s.id !== ignoreId && slotsOverlap(candidate, s));
}

/** Classes scheduled on a given date, earliest first. */
export function slotsForDate(slots: ReadonlyArray<Slot>, date: Date): Slot[] {
  const weekday = isoWeekday(date);
  return slots
    .filter((s) => s.weekday === weekday)
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
}

/** Slots grouped by weekday (1..7), each list sorted by start time. Days with no classes get []. */
export function groupByWeekday(slots: ReadonlyArray<Slot>): Record<number, Slot[]> {
  const grouped: Record<number, Slot[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
  for (const s of slots) {
    if (grouped[s.weekday]) grouped[s.weekday].push(s);
  }
  for (const day of Object.keys(grouped)) {
    grouped[Number(day)].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  }
  return grouped;
}

/**
 * Count how many times each subject's slots occur between two dates
 * (inclusive), skipping holiday dates. Used for the semester-end projection.
 *
 * @param fromKey 'YYYY-MM-DD' first day to count (usually tomorrow, or today if not yet marked)
 * @param toKey   'YYYY-MM-DD' last day (semester end)
 * @param holidays set of 'YYYY-MM-DD' keys to skip
 * @returns map subjectId → number of remaining classes
 */
export function countRemainingBySubject(
  slots: ReadonlyArray<Slot>,
  fromKey: string,
  toKey: string,
  holidays: ReadonlySet<string> = new Set(),
): Record<string, number> {
  const result: Record<string, number> = {};
  const [fy, fm, fd] = fromKey.split('-').map(Number);
  const [ty, tm, td] = toKey.split('-').map(Number);
  const cursor = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);
  const perWeekday: Record<number, Slot[]> = groupByWeekday(slots);

  while (cursor.getTime() <= end.getTime()) {
    const key = `${String(cursor.getFullYear()).padStart(4, '0')}-${String(
      cursor.getMonth() + 1,
    ).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    if (!holidays.has(key)) {
      for (const s of perWeekday[isoWeekday(cursor)]) {
        result[s.subjectId] = (result[s.subjectId] ?? 0) + 1;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}
