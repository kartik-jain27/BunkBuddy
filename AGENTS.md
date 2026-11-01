# AGENTS.md — Attendance App (BunkWise-style, better)

Read this whole file before every task. Detailed specs live in `docs/`. Read ONLY the doc relevant to your current task:

| Working on | Read |
|---|---|
| any screen or behaviour | `docs/PRODUCT_SPEC.md` |
| database, sync, auth | `docs/DATA_MODEL.md` + `supabase/schema.sql` |
| timetable scan | `docs/PRODUCT_SPEC.md` §7 + `supabase/functions/scan-timetable/index.ts` |
| what to build next | `docs/OPENCODE_PROMPTS.md` |

## 1. What this app is

A mobile app (Android first) for Indian college students that tracks attendance, tells them how many classes they can skip or must attend, holds their timetable, and keeps a simple assignment to-do list. It must feel fast, clean and trustworthy: **a wrong percentage destroys the product.**

## 2. LOCKED product decisions — never change, extend, or "improve" these

1. **One global target.** A single integer target % (1–100, default 75) stored on the profile. It applies to every subject. There are NO per-subject targets.
2. **Two statuses only: `present` (tick) and `absent` (cross).** No cancelled, no duty leave, no late, no excused. **No entry = the class does not exist** as far as every number is concerned.
3. **Labs are normal subjects.** One tick = +1 class. No "periods", no weights, no subject type field.
4. **Percentage = present ÷ (present + absent)**, where present/absent = the subject's opening balance + its records. Percentages are **never stored**, always computed.
5. **Marking behaviour:** tap ✓ → present. Tap ✗ → absent. Tapping the already-active button **removes the entry** (undo). Tapping the other button switches it.
6. **Accounts are compulsory.** Nothing except the auth screens is reachable while signed out. (Monetisation comes later; `profiles.plan` already exists.)
7. **Opening balance:** each subject has `initial_present` / `initial_total` so students can start from their current numbers.
8. **Tasks:** title, optional due date, optional subject, done toggle. The add-task input **stays open and focused after each submit** so many tasks can be typed back-to-back (details in `docs/PRODUCT_SPEC.md` §6).
9. **OUT OF SCOPE — do not build, do not stub, do not add UI for:** exam countdown, home-screen widget (the owner will specify it later), cancelled/duty-leave statuses, per-subject targets, lab periods, GPA calculator, notes, social/friends, ads, college-portal login, AI chat, multiple semesters, dark-pattern upsells.

If the spec is silent or ambiguous, **ask the owner. Do not invent features.**

## 3. Stack

- Expo **SDK 56 — do not upgrade the SDK or React Native** (pinned for Expo Go compatibility). React Native, TypeScript (`strict: true`), `expo-router`.
- Local DB: `expo-sqlite`. IDs: `expo-crypto` `randomUUID()`.
- Backend: Supabase (Auth + Postgres + Edge Function). Client: `@supabase/supabase-js`.
- Tests: Jest with `jest-expo` (pure-logic tests need no native mocks).
- **Add no new dependency without asking the owner first.** When you do add one, use `npx expo install <pkg>` so the version matches the SDK.
- State: React Context + small hooks over the repository layer. No Redux, no MobX, no extra state library.

## 4. Folder layout

```
app/                    expo-router screens ONLY (thin: fetch via hooks, render, call actions)
  (auth)/               sign-in / sign-up
  (tabs)/               index (Today), subjects, timetable, tasks, settings
  subject/[id].tsx      subject detail: history + What-if simulator
src/
  lib/                  PURE logic, no React, no I/O  ← the only place math lives
    attendance.ts       percentages, canBunk, mustAttend, simulate, semesterProjection
    dates.ts            date keys, ISO weekday, time helpers
    timetable.ts        slot validation, overlaps, slotsForDate, remaining-class counts
    tasks.ts            title cleanup, grouping, due-soon
    *.test.ts           one test file per module
  db/
    schema.ts           SQLite migrations (append-only)
    migrate.ts          migration runner
    repo/*.ts           ONLY code allowed to run SQL. subjects.ts, slots.ts, records.ts, tasks.ts, profile.ts, holidays.ts
  sync/                 push/pull between SQLite and Supabase
  hooks/                useSubjects(), useToday(), useTasks() ... (call repo, expose state + actions)
  components/           reusable UI (SubjectCard, TickCrossButtons, TaskRow, EmptyState ...)
  theme/                tokens.ts (colors, spacing, radii, type) — the ONLY place for visual constants
supabase/
  schema.sql            run in Supabase SQL editor
  functions/scan-timetable/
docs/
```

## 5. Code rules

1. **All attendance math goes through `src/lib/attendance.ts`.** Never write `present / total * 100`, never compute bunk/recover numbers inside a component or repo. If a needed calculation is missing, add it to `lib/` **with tests first**.
2. Any change to `src/lib/*.ts` requires its tests to be updated and passing before you say you are done. Never delete or weaken a failing test to make it pass — fix the code, or tell the owner the spec is wrong.
3. **Only `src/db/repo/*` touches SQL.** Screens and hooks call repo functions.
4. Every write sets `updated_at = new Date().toISOString()` and `dirty = 1`. Deletes are soft (`deleted_at`) — never `DELETE FROM` a synced table.
5. **Dates:** `'YYYY-MM-DD'` in the user's LOCAL timezone via `toDateKey()`. **Never** use `toISOString().slice(0,10)` for a calendar day (it returns the UTC day — wrong for India late at night). Times `'HH:MM'` 24h. Weekday = ISO number, 1 = Monday … 7 = Sunday. Timestamps (`created_at`, `updated_at`) are ISO UTC strings.
6. IDs are UUIDs created on the device with `randomUUID()`. Never use auto-increment ids.
7. Show percentages with `formatPercentage()` (it truncates, never rounds up). No raw `toFixed` on a percentage.
8. TypeScript: no `any`, no `@ts-ignore`, no non-null `!` except on values you just checked. Fix the type instead.
9. No `console.log` left in committed code. No commented-out code. No TODOs without an owner-approved reason.
10. Secrets: never put an API key, service-role key or `.env` value in the app bundle. Only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` may be public. Never commit `.env`.
11. Keep files small (< 250 lines). Split before they grow.

## 6. UI rules ("clean UI" is a core feature)

1. Colors, spacing, radii, font sizes come **only** from `src/theme/tokens.ts`. No hex codes or magic numbers inside screens. Light and dark themes both defined.
2. Spacing scale: 4 / 8 / 12 / 16 / 24 / 32. One primary accent colour + one secondary. Red/amber/green are reserved for attendance risk (danger/warning/safe).
3. **One primary action per screen.** Large touch targets (≥ 48 dp). Tick/cross buttons ≥ 56 dp.
4. Every list has an **empty state** (one sentence + one button). Every async action has a loading state and an error message a student can understand ("Couldn't save. Check your connection." — not "Error 500").
5. No ads, banners or upsells on the Today screen. Ever.
6. Text: short, plain, friendly. Numbers are big. Never show a raw "NaN", "undefined" or "null" — use "—".
7. Use `FlatList`/`SectionList` for lists. Keyboard must never cover an input (use `KeyboardAvoidingView` + `keyboardShouldPersistTaps="handled"`).
8. Haptic tick on mark (via `expo-haptics`, ask before adding the dependency).

## 7. How you work (important — follow exactly)

1. **Plan first.** Before editing anything, reply with: files you will create/change, the steps, and any questions. **Wait for the owner's OK.**
2. **One milestone per session.** Do not start the next feature. Do not refactor files outside the task.
3. Read the existing code before changing it. Match its patterns. If the repo already has a screen or component that does the job, extend it instead of creating a duplicate.
4. After coding, run, in this order, and paste the results:
   - `npx tsc --noEmit`
   - `npm test`
   - `npx expo lint` (if configured)
   Fix every failure. Do not report "done" with failing checks.
5. Then give a **short summary**: what changed, which files, what to tap to verify manually (exact steps).
6. Suggest a git commit message. Do not run `git push`. Do not rewrite git history.
7. Never claim something works without running it. If you could not test something (e.g. needs a device), say so explicitly.
8. If a command fails twice for the same reason, stop and show the owner the error instead of trying random fixes.
9. Do not delete files, drop tables or edit migrations that have shipped without explicit permission.

## 8. Commands

```
npx expo start                 # run the app (Expo Go on Android)
npx tsc --noEmit               # type-check
npm test                       # unit tests (jest)
npx expo lint                  # lint
supabase functions deploy scan-timetable   # deploy scan function (owner runs this)
```

## 9. Definition of done (every task)

- [ ] Matches `docs/PRODUCT_SPEC.md` and does not violate §2 above
- [ ] `tsc` clean, tests pass, new logic has tests
- [ ] Empty / loading / error states handled
- [ ] Works with zero data, one item, and 50 items
- [ ] No new dependencies unless approved
- [ ] Manual verification steps written for the owner
