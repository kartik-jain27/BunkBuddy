# DATA MODEL, SYNC & AUTH

Two databases hold the same data:

- **Local SQLite** (`expo-sqlite`) — what the app reads and writes. Always. Works offline.
- **Supabase Postgres** — the account store and backup. The app talks to it only through `src/sync/`.

Schemas: `src/db/schema.ts` (local, verified in SQLite) and `supabase/schema.sql` (server, syntax-checked with the Postgres parser; **run it in the Supabase SQL editor and fix any error it reports**).

---

## 1. Tables

| Table | Purpose | Key columns |
|---|---|---|
| `profile` (local) / `profiles` (server) | One row per user | `target_pct` (1–100), `semester_start`, `semester_end`, `onboarded`, `plan` (server only: `free`/`pro`) |
| `subjects` | A subject (labs are just subjects) | `name`, `color`, `initial_present`, `initial_total`, `sort_order` |
| `timetable_slots` | Recurring weekly class | `subject_id`, `weekday` (1=Mon…7=Sun), `start_time`, `end_time`, `room` |
| `attendance_records` | One marked class | `subject_id`, `slot_id` (NULL = extra class), `date`, `status` (`present`/`absent`) |
| `tasks` | To-do items | `title`, `due_date`, `subject_id`, `done`, `done_at` |
| `holidays` | No-class days | `date`, `label` |
| `sync_meta` (local only) | Sync cursors | `key`, `value` |
| `scan_usage` (server only) | Daily scan counter | `user_id`, `day`, `count` |

Every synced table also has `id` (UUID made on the device), `created_at`, `updated_at` (client clock, ISO UTC), `deleted_at` (soft delete), and:
- local: `dirty` (1 = needs pushing), `user_id`
- server: `user_id`, `synced_at` (set by a server trigger; the pull cursor)

**There is deliberately no column that stores a percentage, a present-count total, or a bunk number.** They are derived.

### Derived per-subject counts (the ONLY way to get counts)

```sql
SELECT s.id,
       s.initial_present + COALESCE(SUM(r.status = 'present'), 0) AS present,
       s.initial_total   + COUNT(r.id)                              AS total
FROM subjects s
LEFT JOIN attendance_records r
       ON r.subject_id = s.id AND r.deleted_at IS NULL
WHERE s.deleted_at IS NULL
GROUP BY s.id
ORDER BY s.sort_order, s.created_at, s.name;
```

Feed each `{present, total}` into `src/lib/attendance.ts`. Overall = `sumCounts()` of all rows. (This query was run against the real schema and returns correct numbers, including ignoring soft-deleted records.)

### Records for one date (Today screen)

```sql
SELECT id, subject_id, slot_id, status
FROM attendance_records
WHERE date = ? AND deleted_at IS NULL;
```
Join in JS with `slotsForDate(slots, date)` by `slot_id`. Rows with `slot_id IS NULL` are "Extra" classes.

---

## 2. Repository layer (`src/db/repo/`)

Only these files run SQL. All return plain objects in **camelCase**. All writes set `updated_at` (now, ISO UTC) and `dirty = 1`. All deletes are soft.

```ts
// subjects.ts
listSubjectsWithCounts(): Promise<Array<Subject & Counts>>
createSubject(input: {name; color; initialPresent; initialTotal}): Promise<Subject>
updateSubject(id, patch): Promise<void>
deleteSubjectCascade(id): Promise<DeleteToken>   // soft-deletes subject + slots + records, unlinks tasks; token enables undo
restore(token: DeleteToken): Promise<void>

// slots.ts
listSlots(): Promise<Slot[]>
createSlots(drafts: SlotDraft[]): Promise<Slot[]>   // one transaction
updateSlot(id, patch): Promise<void>
deleteSlot(id): Promise<void>
replaceAllSlots(drafts: SlotDraft[], newSubjects: NewSubject[]): Promise<void>  // scan "Replace"; one transaction

// records.ts
listRecordsForDate(dateKey): Promise<AttendanceRecord[]>
listRecordsForSubject(subjectId): Promise<AttendanceRecord[]>
setRecord(input: {subjectId; slotId: string | null; date; status: 'present'|'absent'}): Promise<void>
    // upsert semantics for (slotId, date) when slotId != null
clearRecord(id): Promise<void>                     // soft delete = "tap active button again"
addExtraRecord(subjectId, date, status): Promise<void>

// tasks.ts
listTasks(): Promise<Task[]>
createTask(input: {title; dueDate; subjectId}): Promise<Task>   // title must already be normalizeTitle()'d
updateTask(id, patch): Promise<void>
toggleTask(id): Promise<void>
deleteTask(id): Promise<void>
clearDoneTasks(): Promise<void>

// profile.ts
getProfile(): Promise<Profile>
updateProfile(patch): Promise<void>

// holidays.ts
listHolidays(): Promise<Holiday[]>
addHoliday(date, label?): Promise<void>
removeHoliday(id): Promise<void>
```

Rules: use parameterised queries (`?`) — never string-concatenate user input into SQL. Wrap multi-statement changes in `db.withTransactionAsync`.

---

## 3. Migration runner (`src/db/migrate.ts`)

Reference implementation — **check the exact `expo-sqlite` method names against the installed version's docs before using**:

```ts
import * as SQLite from 'expo-sqlite';
import { MIGRATIONS } from './schema';

export async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('attendance.db');
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
    version += 1;
  }
  return db;
}
```

Migrations are **append-only**. To change the schema after shipping, add `MIGRATIONS[1]` (e.g. `ALTER TABLE ...`). Never edit `MIGRATIONS[0]` once any user has it.

---

## 4. Auth

- Supabase Auth with **Google (OAuth)** and **email one-time code**.
- Client: `createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } })` — the existing app already uses `@react-native-async-storage/async-storage`.
- A route guard in the root layout: no session → `(auth)`; session but `profile.onboarded = 0` → onboarding; else tabs.
- On first sign-in on a device: pull everything from the server (§5). A new account has just a profile row (created by a DB trigger) → onboarding.
- **Sign out:** push pending changes if online; then delete all local rows (and `sync_meta`), then `supabase.auth.signOut()`. This stops one account's data leaking into another account on a shared phone.
- **Delete account:** `supabase.rpc('delete_my_account')` → wipe local → auth screen.
- All local rows get `user_id = session.user.id` on creation. Sync filters/validates by it.
- The `plan` column (`free`/`pro`) is changeable only by the service role (future payment webhook). The client cannot upgrade itself — `supabase/schema.sql` removes its write access to that column.

---

## 5. Sync (`src/sync/`)

Principle: **local writes are instant; sync is background and failure-tolerant.** A failed sync never blocks the UI, never shows an error dialog, never loses data.

### 5.1 Push (local → server)
Order matters because of foreign keys: `subjects` → `timetable_slots` → `attendance_records` → `tasks` → `holidays`, then `profile` (via `.update()`, never upsert).

For each table:
1. `SELECT * FROM <t> WHERE dirty = 1 LIMIT 200`.
2. Map to the server shape (same snake_case names; add `user_id`; drop `dirty`).
3. `supabase.from(t).upsert(rows, { onConflict: 'id' })`.
4. On success: `UPDATE <t> SET dirty = 0 WHERE id = ? AND updated_at = ?` — **match on the `updated_at` that was pushed**, so a row edited during the push stays dirty.
5. Repeat until no dirty rows remain. On any error: stop, leave rows dirty, retry later.

### 5.2 Pull (server → local)
For each table, in the same order:
1. Cursor = `sync_meta['pull:<table>']` (default `'1970-01-01T00:00:00Z'`).
2. `select * where synced_at > cursor order by synced_at asc limit 500` (RLS already limits to the user). Page until fewer than 500 return.
3. Normalise each row: timestamps → `new Date(x).toISOString()` (the server may return `+00:00`, local strings use `Z`; mixed formats break string comparison); `time` columns `'HH:MM:SS'` → `slice(0, 5)`; booleans ↔ 0/1.
4. Apply locally if **(no local row) OR (local.dirty = 0) OR (remote.updated_at >= local.updated_at)**; set `dirty = 0`. Otherwise keep the local row (it will push next).
5. Save the largest `synced_at` seen as the new cursor — after the page is applied, in the same transaction.
6. Profile: pull the row where `id = auth uid` into local `profile` (`id = 'me'`).

### 5.3 When to run
`push → pull` on: app start (after the session is ready), app returning to foreground, 2 s after the last local write (debounced), and pull-to-refresh on Today. Never overlap runs (single in-flight guard).

### 5.4 Conflicts
Last write wins by `updated_at`. Acceptable for a single student using one or two devices. Do not build merge logic.

### 5.5 Deletes
Soft deletes sync as ordinary updates (`deleted_at` set). Every query for display filters `deleted_at IS NULL`. A later cleanup job (not in v1) may hard-delete rows older than 90 days.

### 5.6 Sync status (for Settings line)
Keep `lastSyncedAt` and `pendingCount` (`SELECT COUNT(*)` of dirty rows across tables). Show "Synced just now" / "N changes waiting — offline" / "Syncing…".

---

## 6. Security checklist

- RLS enabled on every table with `user_id = auth.uid()` policies (already in `supabase/schema.sql`).
- The anon key is public by design; **RLS is the protection**. Test: with a second account, confirm you cannot read the first account's rows.
- Never ship the `service_role` key. It is used only inside the edge function (injected by Supabase).
- The scan function verifies the JWT and rate-limits per user (5/day).
- Do not log tokens, emails or attendance data to the console in production.
