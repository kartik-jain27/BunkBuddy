/**
 * schema.ts — local SQLite (expo-sqlite) schema, as ordered migrations.
 *
 * Rules:
 *  - NEVER edit a migration that has shipped. Append a new one.
 *  - Run with PRAGMA user_version: apply every migration whose index >= user_version,
 *    then set user_version = MIGRATIONS.length (see docs/DATA_MODEL.md "Migration runner").
 *  - Every synced table has: id (uuid, generated on the device), updated_at (ISO UTC),
 *    deleted_at (soft delete), dirty (1 = needs pushing to Supabase).
 *  - There is NO column for percentages. They are always computed (src/lib/attendance.ts).
 *
 * Column names are snake_case here; repository functions map to camelCase.
 */

export const MIGRATIONS: string[] = [
  // ---------------------------------------------------------------- 001 initial
  `
  PRAGMA foreign_keys = ON;

  -- One row (id = 'me'). Mirrors the Supabase profiles row for the signed-in user.
  CREATE TABLE profile (
    id              TEXT PRIMARY KEY NOT NULL,
    user_id         TEXT,
    display_name    TEXT,
    target_pct      INTEGER NOT NULL DEFAULT 75 CHECK (target_pct BETWEEN 1 AND 100),
    semester_start  TEXT,            -- 'YYYY-MM-DD'
    semester_end    TEXT,            -- 'YYYY-MM-DD'
    onboarded       INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    dirty           INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE subjects (
    id               TEXT PRIMARY KEY NOT NULL,
    user_id          TEXT,
    name             TEXT NOT NULL CHECK (length(trim(name)) > 0),
    color            TEXT NOT NULL DEFAULT '#7C3AED',
    -- opening balance: attendance before the student started using the app
    initial_present  INTEGER NOT NULL DEFAULT 0 CHECK (initial_present >= 0),
    initial_total    INTEGER NOT NULL DEFAULT 0 CHECK (initial_total >= 0),
    sort_order       INTEGER NOT NULL DEFAULT 0,
    created_at       TEXT NOT NULL,
    updated_at       TEXT NOT NULL,
    deleted_at       TEXT,
    dirty            INTEGER NOT NULL DEFAULT 1,
    CHECK (initial_present <= initial_total)
  );

  CREATE TABLE timetable_slots (
    id          TEXT PRIMARY KEY NOT NULL,
    user_id     TEXT,
    subject_id  TEXT NOT NULL REFERENCES subjects(id),
    weekday     INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 7),  -- 1 = Monday ... 7 = Sunday
    start_time  TEXT NOT NULL,   -- 'HH:MM'
    end_time    TEXT NOT NULL,   -- 'HH:MM'
    room        TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    deleted_at  TEXT,
    dirty       INTEGER NOT NULL DEFAULT 1,
    CHECK (end_time > start_time)
  );
  CREATE INDEX idx_slots_weekday ON timetable_slots(weekday) WHERE deleted_at IS NULL;

  -- One row per marked class. No row = nothing happened. status is only present|absent.
  CREATE TABLE attendance_records (
    id          TEXT PRIMARY KEY NOT NULL,
    user_id     TEXT,
    subject_id  TEXT NOT NULL REFERENCES subjects(id),
    slot_id     TEXT REFERENCES timetable_slots(id),   -- NULL for a manually added extra class
    date        TEXT NOT NULL,                          -- 'YYYY-MM-DD' local day
    status      TEXT NOT NULL CHECK (status IN ('present', 'absent')),
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    deleted_at  TEXT,
    dirty       INTEGER NOT NULL DEFAULT 1
  );
  -- A timetable slot can only be marked once per date (live rows only).
  CREATE UNIQUE INDEX uq_record_slot_date
    ON attendance_records(slot_id, date)
    WHERE slot_id IS NOT NULL AND deleted_at IS NULL;
  CREATE INDEX idx_records_subject ON attendance_records(subject_id) WHERE deleted_at IS NULL;
  CREATE INDEX idx_records_date ON attendance_records(date) WHERE deleted_at IS NULL;

  CREATE TABLE tasks (
    id          TEXT PRIMARY KEY NOT NULL,
    user_id     TEXT,
    title       TEXT NOT NULL CHECK (length(trim(title)) > 0),
    due_date    TEXT,                                   -- 'YYYY-MM-DD' or NULL
    subject_id  TEXT REFERENCES subjects(id),
    done        INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
    done_at     TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    deleted_at  TEXT,
    dirty       INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX idx_tasks_open ON tasks(done, due_date) WHERE deleted_at IS NULL;

  -- Days with no classes (used by the semester-end projection).
  CREATE TABLE holidays (
    id          TEXT PRIMARY KEY NOT NULL,
    user_id     TEXT,
    date        TEXT NOT NULL,
    label       TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    deleted_at  TEXT,
    dirty       INTEGER NOT NULL DEFAULT 1
  );
  CREATE UNIQUE INDEX uq_holiday_date ON holidays(date) WHERE deleted_at IS NULL;

  -- Key/value bag for sync bookkeeping (e.g. 'last_pull_at').
  CREATE TABLE sync_meta (
    key    TEXT PRIMARY KEY NOT NULL,
    value  TEXT
  );
  `,
];
