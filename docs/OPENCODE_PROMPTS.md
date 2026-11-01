# OPENCODE PROMPTS — build order

Paste ONE prompt per session. `AGENTS.md` is loaded automatically by opencode; each prompt also tells it which spec section to read.

## How to run each milestone (same loop every time)

1. Start a **fresh opencode session** (`/new`). Small models degrade as context grows — one milestone per session.
2. Paste the prompt. Use **Plan mode first** (Tab switches between Plan and Build) so it lists files and steps without editing anything.
3. Read the plan. If it adds a dependency, invents a feature, or touches unrelated files — reply "No: <what's wrong>" and let it re-plan.
4. Say **"Approved, build it."**
5. It must paste the results of `npx tsc --noEmit` and `npm test`. If it didn't, ask: "Run tsc and tests and paste the output."
6. Do the manual check listed under **You verify**. Only then commit:
   `git add -A && git commit -m "<message it suggested>"`
7. If a session goes wrong: `git restore .` (or `git reset --hard`) and start the milestone again with a better prompt. Never stack fixes on a broken base.

**Rule for you:** if opencode proposes changing `src/lib/attendance.ts` logic or a locked decision in `AGENTS.md §2`, say no.

## Build order at a glance

| # | Milestone | Needs |
|---|---|---|
| M0 | Audit repo + test runner | SETUP §A |
| M1 | Theme + base UI components | — |
| M2 | Local database layer | — |
| M3 | Subjects tab | M1, M2 |
| M4 | Today screen (marking) | M3 |
| M5 | Timetable manual editor | M3 |
| M6 | Tasks page | M1, M2 |
| M7 | Subject detail: history + What-if | M4 |
| M8 | Settings | M2 |
| M9 | Auth + onboarding | SETUP §B |
| M10 | Cloud sync | M9 |
| M11 | Class notifications | M5 |
| M12 | Timetable scan | SETUP §C, M5 |
| M13 | Semester-end projection | M5, M8 |
| M14 | Polish + Play Store readiness | all |

Order is chosen so the app is usable early: after M4–M6 you already have a working offline attendance app + tasks; accounts and sync come after the core feels right.

---

## M0 — Audit the repo and make tests run

```
Read AGENTS.md. This is milestone M0. Do NOT change any app code yet.

1. Inspect the repo and report (briefly): Expo SDK version, existing folders under app/ and src/, the state/storage approach currently used (e.g. AsyncStorage/Context), which screens already exist, and which dependencies are installed.
2. Compare to the folder layout in AGENTS.md §4 and the screens in docs/PRODUCT_SPEC.md §2. Give me a table: "exists / partially exists / missing" per screen, and list any existing code that conflicts with the LOCKED decisions in AGENTS.md §2 (for example: per-subject targets, cancelled/duty-leave statuses, exam countdown, lab periods, stored percentages).
3. Check that jest-expo is installed and `npm test` runs the 4 test files in src/lib. If the setup is broken, fix ONLY the test configuration.
4. Run `npx tsc --noEmit` and `npm test` and paste the output.

Plan first. Wait for my OK before editing.
```
**You verify:** `npm test` shows 4 files / 74 tests passing.

---

## M1 — Theme and base UI components (this is what makes the UI "clean")

```
Read AGENTS.md (especially §6 UI rules). Milestone M1: design foundation. No feature screens.

Create:
- src/theme/tokens.ts: light and dark palettes (primary accent, secondary accent, background, surface, text, muted text, border, and semantic safe/warning/danger colours), spacing scale (4/8/12/16/24/32), radii, font sizes/weights. Keep the existing plum/violet + teal identity if the repo already has it.
- src/theme/ThemeProvider.tsx + useTheme(): follows system light/dark, with an override setter (system | light | dark).
- src/components/: Button (primary, secondary, ghost; loading state; min height 48), Card, Chip (with optional colour dot), RiskChip (takes 'safe'|'warning'|'danger'|'no-data'), EmptyState (message + optional button), ScreenHeader, BottomSheet (modal sheet with keyboard handling), Snackbar with Undo action (provider + useSnackbar()), Stepper (− value +), TickCrossButtons (✓ ✗ with states: unmarked / present / absent, ≥56dp, onPress handlers only — no logic).
- A temporary dev screen app/_dev/components.tsx showing every component in light and dark so I can eyeball them. (I will delete it later.)

Do not add dependencies. Plan first, wait for OK.
```
**You verify:** open the dev screen, toggle dark mode on the phone; nothing unreadable, nothing cramped.

---

## M2 — Local database layer

```
Read AGENTS.md, docs/DATA_MODEL.md (§1–§3), and src/db/schema.ts. Milestone M2: local database only. No UI changes except a provider.

1. Install expo-sqlite and expo-crypto with `npx expo install`.
2. Create src/db/migrate.ts per docs/DATA_MODEL.md §3 (check the real expo-sqlite API of the installed version; fix names if the reference differs).
3. Create the repository files in src/db/repo/ with EXACTLY the function list in docs/DATA_MODEL.md §2. Parameterised SQL only. Every write sets updated_at and dirty=1. Deletes are soft. Use db.withTransactionAsync for multi-statement operations. user_id may be NULL until auth exists (M9).
4. Create src/db/DatabaseProvider.tsx: opens + migrates the DB once, exposes it via context, shows a simple splash until ready. Wire it into the root layout.
5. Create hooks in src/hooks/: useSubjects() (subjects with counts using the SQL in DATA_MODEL.md §1), useProfile(). Each exposes data, loading, and action functions; they refresh after every write.
6. Write jest tests for anything pure (e.g. row↔object mapping functions). Do not try to unit-test SQLite itself.
7. Remove/replace the old AsyncStorage data layer ONLY if it exists and nothing else depends on it; if screens still use it, list them and leave it for the milestones that replace those screens.

Plan first, wait for OK.
```
**You verify:** app boots; no crash; (temporary) add a subject through a hook call from a dev button and see it persist after restart.

---

## M3 — Subjects tab

```
Read AGENTS.md and docs/PRODUCT_SPEC.md §5.1 and §5.3. Milestone M3.

Build the Subjects tab and the add/edit/delete subject flows:
- SubjectCard component: colour dot, name, big percentage via formatPercentage(), "present / total", RiskChip from riskLevel(), and statusMessage(). All numbers via src/lib/attendance.ts using the profile target (default 75).
- Sort: danger, warning, safe, no-data; then by name.
- "+ Add subject" BottomSheet: name (required), colour picker (8 preset colours), optional "Already attended / Out of so far" with validation attended ≤ out of. Warn (don't block) on duplicate name, case-insensitive.
- Edit subject (rename, colour, opening balance). Delete with confirm + Snackbar Undo (uses deleteSubjectCascade/restore).
- Empty state per spec.
Do not touch the Today screen or other tabs. Plan first, wait for OK.
```
**You verify:** add 3 subjects (one with 23/29); card shows 79.3%, "You can skip 1 more class." Delete one → Undo brings it back.

---

## M4 — Today screen

```
Read AGENTS.md and docs/PRODUCT_SPEC.md §4 (all). Milestone M4.

Build the Today tab. Needs timetable slots, but the timetable editor comes in M5, so for testing add a small dev-only button that inserts two sample slots for today (remove it when M5 lands).
- Date bar with ◀ ▶ and Today chip; future dates not markable.
- Overall card using sumCounts() + statusMessage() + progress bar with target marker.
- Class rows from slotsForDate(); TickCrossButtons; toggle semantics EXACTLY as spec §4.2 (tap active button again = remove entry; tap other = switch). Haptics only if expo-haptics is already installed — otherwise skip and tell me.
- Under each unmarked row, the "If you skip: x% · still safe / below target" hint using simulate().
- "+ Extra class" sheet (spec §4.3).
- Snackbar Undo after each change. AppState foreground → recompute today (§4.5).
- Empty states per §4.4. Skip the "Due soon" strip for now (tasks come in M6).
Use SQL aggregation for counts; do not load every record into JS. Plan first, wait for OK.
```
**You verify:** mark ✓ → % rises; mark ✗ → falls; tap ✗ again → entry removed and % returns. Unmarked rows change nothing. Kill and reopen the app: marks persist.

---

## M5 — Timetable manual editor

```
Read AGENTS.md and docs/PRODUCT_SPEC.md §7.1. Milestone M5. NO scanning yet.

- Timetable tab: day chips Mon–Sun, slot list for the selected day via groupByWeekday().
- "+ Add class" BottomSheet: subject picker (+ inline "New subject…"), multi-select day chips (creates one slot per selected day), start/end time pickers, optional room. Use validateSlot() for errors and conflictsWith() for the amber overlap warning (allow saving anyway).
- Edit/delete a slot (Snackbar Undo). Deleting a slot must NOT delete its past records.
- "Copy day" action.
- For time pickers: tell me which package you propose (prefer @react-native-community/datetimepicker via `npx expo install`) and wait for my OK before installing.
- Remove the dev "insert sample slots" button from M4.
Plan first, wait for OK.
```
**You verify:** add DBMS on Mon+Wed+Fri 9–10 → three slots; Today (on a Monday) shows it; overlap warning appears when you add another class at 9:30.

---

## M6 — Tasks page

```
Read AGENTS.md and docs/PRODUCT_SPEC.md §6 (all) — especially §6.2, the quick-add composer. Milestone M6.

- Tasks tab: sections from groupTasks() in the order of spec §6.1; Done section collapsed with count and "Clear done".
- TaskRow: checkbox, title, due chip, subject chip. Toggle done; tap row → edit BottomSheet (title, due date, subject, delete with Snackbar Undo).
- THE COMPOSER (critical): floating "+ Add task" button opens a composer docked above the keyboard with an auto-focused TextInput (returnKeyType="send", blurOnSubmit={false}) + send button + chips (Today, Tomorrow, Pick date, Subject). On submit: normalizeTitle(); if null do nothing and keep focus; else create the task, clear the text, KEEP the input focused and the keyboard open, scroll the list to the new task. Chosen date/subject stay selected until the composer closes. Close via ✕, tapping the list, or hardware Back.
- Use keyboardShouldPersistTaps="handled" so tapping chips/send doesn't dismiss the keyboard.
- Add the "Due soon" strip (max 3 via dueSoon()) to the Today tab.
- Empty state per spec. Date picker: reuse the one chosen in M5.
Plan first, wait for OK.
```
**You verify (the key test):** tap + Add task → type "DBMS assignment" → press Enter → task appears, **keyboard stays open, cursor still in the box** → type another → Enter → repeat 5×. Tap "Tomorrow" once: next tasks all get tomorrow.

---

## M7 — Subject detail: history and What-if

```
Read AGENTS.md and docs/PRODUCT_SPEC.md §5.2. Milestone M7.

Build app/subject/[id].tsx: header with ⋯ menu, big percentage + counts + RiskChip + statusMessage; What-if simulator card (Attend-next and Skip-next Steppers 0–30, live result via simulate(), "Above target ✓" or "Below target — you'd need N more" via mustAttend() on projected counts, Reset button; it never writes to the DB); History list grouped by month (tap row → sheet to switch status / change date / delete); "+ Add past entry"; opening balance line with edit. Navigate here from SubjectCard and from Today rows (tap on the subject name).
Skip the semester-end card (M13). Plan first, wait for OK.
```
**You verify:** subject at 23/29 → set Skip next = 2 → shows 74.1% "Below target"; Skip = 1 → 76.6% above.

---

## M8 — Settings

```
Read AGENTS.md and docs/PRODUCT_SPEC.md §10 and §9 (settings parts only). Milestone M8.

Build the Settings tab sections: Attendance target (Stepper 1–100, big value; changing it recomputes everything instantly), Semester start/end dates, Holidays list (add/remove), Appearance (System/Light/Dark via ThemeProvider), version, Privacy/Terms links (placeholder URLs from a constants file). Account name field is read from the profile.
Leave Sign out, Delete account, Sync status and Notifications toggle as clearly disabled placeholders — they come in M9–M11. Plan first, wait for OK.
```
**You verify:** change target 75 → 80; every percentage message across the app updates without restart.

---

## M9 — Auth and onboarding

```
Read AGENTS.md, docs/DATA_MODEL.md §4, and docs/PRODUCT_SPEC.md §3. Milestone M9. I have completed docs/SETUP.md section B and .env has the Supabase URL + anon key.

1. Install @supabase/supabase-js, expo-web-browser (and expo-linking/expo-auth-session only if truly needed) — list what you propose first and wait for my OK.
2. src/auth/supabase.ts (client per DATA_MODEL §4), AuthProvider (session state, signInWithGoogle, requestEmailCode, verifyEmailCode, signOut), route guard in the root layout: no session → (auth); session && !profile.onboarded → onboarding; else tabs.
3. app/(auth)/sign-in.tsx per spec §3.1: Google button + email-code flow. Plain-language errors.
4. app/onboarding/: three steps per spec §3.2 (target, subjects with the persistent quick-add input and optional opening balance, timetable choice — the "Scan" button can be disabled until M12). Do not request notification permission yet (M11).
5. New rows get user_id = session.user.id. Sign out wipes local tables (DATA_MODEL §4). Wire Sign out in Settings.
6. Offline launch with an existing session must open the app.
No sync yet (M10). Plan first, wait for OK.
```
**You verify:** sign in with Google and with email code; kill the app and reopen offline (airplane mode) → still signed in. Sign out → data cleared.

---

## M10 — Cloud sync

```
Read AGENTS.md and docs/DATA_MODEL.md §5 (all) and supabase/schema.sql. Milestone M10.

Build src/sync/: push, pull, runSync() with a single-in-flight guard, triggers (app start after session, foreground, 2 s debounce after writes, pull-to-refresh on Today). EXACTLY the algorithm in DATA_MODEL §5: push order, "match on pushed updated_at before clearing dirty", pull cursors in sync_meta, timestamp/time normalisation, apply rule (no local row OR not dirty OR remote.updated_at >= local.updated_at). Profile is pulled into local 'me' and pushed with .update(), never upsert.
Write jest tests for the pure parts (row normalisation, apply-decision function). Sync status line in Settings (Synced just now / N changes waiting / Syncing…). Sync failures are silent and retried; never show an error dialog.
Plan first, wait for OK.
```
**You verify:** add data on phone → open Supabase Table Editor → rows present. Sign out, sign in → everything comes back. Airplane mode: mark classes → turn on internet → they appear in Supabase.

---

## M11 — Class notifications

```
Read AGENTS.md and docs/PRODUCT_SPEC.md §8. Milestone M11.

Install expo-notifications via `npx expo install` (ask first if it needs a config plugin). Implement: permission request at the end of onboarding (one-sentence reason), weekly repeating local notification at each slot's end_time ("Did you attend {Subject}?") with Present/Absent action buttons that call setRecord for (slot, that date); tapping the body opens Today. Reschedule all on slot/subject/toggle change and on app start. Enable the Settings toggle.
Important: tell me honestly what does and does not work in Expo Go on Android (especially action buttons) — test and report; do not fake or work around it. If a development build is needed, say exactly which command to run.
Plan first, wait for OK.
```
**You verify:** a slot ending in 2 minutes → notification arrives → tap Present → Today shows ✓.

---

## M12 — Timetable scan

```
Read AGENTS.md, docs/PRODUCT_SPEC.md §7.2, and supabase/functions/scan-timetable/index.ts. Milestone M12. I have deployed the function (docs/SETUP.md section C).

Build the client flow: source sheet (camera / gallery via expo-image-picker — ask before installing; resize/compress via expo-image-manipulator — ask first), call supabase.functions.invoke('scan-timetable', { body: { image_base64, mime } }), loader with Cancel, error handling exactly as spec §7.2.4, and the REVIEW screen: rows grouped by weekday, low-confidence rows highlighted amber with "Check this", every row editable with the same sheet as the manual editor, "+ Add missing class", warnings at the top, subject matching + "New subjects" section (rename / merge / keep), Replace-or-Add choice, one-transaction save via replaceAllSlots or createSlots. Nothing is saved until the user taps Save.
Reuse timetable.ts validation. Do NOT modify the edge function without telling me. Enable the "Scan" buttons in onboarding, empty states and the Timetable header.
Plan first, wait for OK.
```
**You verify:** photograph a real printed timetable of your college. Count the mistakes on the review screen — this tells you whether your chosen vision model is good enough.

---

## M13 — Semester-end projection

```
Read AGENTS.md and docs/PRODUCT_SPEC.md §9. Milestone M13.

Add the "By {end date}" card to the subject detail screen using countRemainingBySubject() and semesterProjection() with the holiday set from the DB. Counting rule: remaining = classes from tomorrow through semester end (minus holidays) + today's slots of this subject that are still unmarked. Show reachable/unreachable copy exactly as in the spec plus the caption. If semester end isn't set, show the "Set your semester end date" card linking to Settings. Add a pure helper + tests for the "today's unmarked slots" part if you add one. Plan first, wait for OK.
```
**You verify:** set semester end 6 weeks away; numbers match a hand calculation for one subject.

---

## M14 — Polish and Play Store readiness

```
Read AGENTS.md and docs/PRODUCT_SPEC.md §10–§12. Milestone M14.

1. Implement Delete account (type DELETE to confirm → supabase.rpc('delete_my_account') → wipe local → auth screen).
2. Audit every screen for: empty state, loading state, plain-language error, ≥48dp touch targets, keyboard never covering inputs, no "NaN/undefined/null" ever visible, dark mode legibility. List what you fixed.
3. Remove the dev screen and any leftover dev buttons, console.log calls, and dead code.
4. Performance check: Today and Subjects with 20 subjects × 300 records each stay smooth (use a throwaway seeding script, don't commit it).
5. Create eas.json profiles (development, preview, production AAB) and app.json fields (name, slug, android.package, version, icon/splash placeholders). Tell me what I must provide (icon, package name, keystore handled by EAS).
Plan first, wait for OK.
```
**You verify:** full run-through as a brand-new user on a real phone, offline and online.

---

## Emergency prompts

**It went off-spec:**
```
Stop. You changed behaviour that is locked in AGENTS.md §2 / docs/PRODUCT_SPEC.md §<n>. Revert only that part, tell me which files you touched, and re-run tsc and npm test.
```

**It says "done" without proof:**
```
Run `npx tsc --noEmit` and `npm test` now and paste the full output. Then list the exact manual steps I should tap to verify this milestone.
```

**It wants to add a package:**
```
Do not install anything yet. Why is it needed, what is the smallest alternative using what we already have, and what is the package's size and maintenance status?
```

**Math looks wrong anywhere:**
```
Do not edit src/lib/attendance.ts. Write a failing jest test in attendance.test.ts that reproduces the wrong number using present/total/target values, show me the test output, and wait. I will decide whether the code or my expectation is wrong.
```
