/**
 * mappers.ts — pure snake_case row → camelCase object mapping.
 *
 * Kept separate from the repositories so it can be unit-tested without
 * loading expo-sqlite or a device database.
 */

import type { AttendanceStatus } from '../lib/attendance';
import type { Task } from '../lib/tasks';
import type { Slot } from '../lib/timetable';
import type {
  AttendanceRecord,
  Holiday,
  Profile,
  Subject,
  SubjectWithCounts,
} from './types';

// ---------------------------------------------------------------- row shapes

export interface SubjectRow {
  id: string;
  name: string;
  color: string;
  initial_present: number;
  initial_total: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubjectWithCountsRow extends SubjectRow {
  present: number;
  total: number;
}

export interface SlotRow {
  id: string;
  subject_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  room: string | null;
}

export interface AttendanceRecordRow {
  id: string;
  subject_id: string;
  slot_id: string | null;
  date: string;
  status: AttendanceStatus;
}

export interface TaskRow {
  id: string;
  title: string;
  due_date: string | null;
  subject_id: string | null;
  done: number;
  created_at: string;
  done_at: string | null;
}

export interface ProfileRow {
  id: string;
  display_name: string | null;
  target_pct: number;
  semester_start: string | null;
  semester_end: string | null;
  onboarded: number;
}

export interface HolidayRow {
  id: string;
  date: string;
  label: string | null;
}

// ------------------------------------------------------------------ mappers

export function mapSubjectRow(row: SubjectRow): Subject {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    initialPresent: row.initial_present,
    initialTotal: row.initial_total,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSubjectWithCountsRow(row: SubjectWithCountsRow): SubjectWithCounts {
  return {
    ...mapSubjectRow(row),
    present: row.present,
    total: row.total,
  };
}

export function mapSlotRow(row: SlotRow): Slot {
  return {
    id: row.id,
    subjectId: row.subject_id,
    weekday: row.weekday,
    start: row.start_time,
    end: row.end_time,
    room: row.room,
  };
}

export function mapRecordRow(row: AttendanceRecordRow): AttendanceRecord {
  return {
    id: row.id,
    subjectId: row.subject_id,
    slotId: row.slot_id,
    date: row.date,
    status: row.status,
  };
}

export function mapTaskRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    dueDate: row.due_date,
    subjectId: row.subject_id,
    done: row.done === 1,
    createdAt: row.created_at,
    doneAt: row.done_at,
  };
}

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    targetPct: row.target_pct,
    semesterStart: row.semester_start,
    semesterEnd: row.semester_end,
    onboarded: row.onboarded === 1,
  };
}

export function mapHolidayRow(row: HolidayRow): Holiday {
  return {
    id: row.id,
    date: row.date,
    label: row.label,
  };
}
