# PRODUCT SPEC

Authoritative description of every screen and behaviour. If this file and your instincts disagree, this file wins. If this file is silent, **ask the owner** — do not invent.

Terminology: **target** = the one global attendance % (default 75). **Opening balance** = a subject's `initial_present / initial_total`. **Slot** = one recurring timetable entry (e.g. Mon 09:00–10:00 DBMS). **Record** = one marked class (present or absent).

---

## 1. Principles

1. **The number must be right.** Every percentage/bunk/recover figure comes from `src/lib/attendance.ts`. Never recompute in UI.
2. **Marking a class takes one tap.** Everything else is secondary.
3. **No entry = no change.** An unmarked class never affects any figure.
4. **Works offline.** Every action works without internet and syncs later. Only sign-in, first sync and timetable scan need a connection.
5. **Clean.** One primary action per screen, generous spacing, big numbers, no clutter, no ads.

---

## 2. Navigation

Signed out → `(auth)` stack only.
Signed in → bottom tabs, in this order:

| Tab | Route | Purpose |
|---|---|---|
| Today | `app/(tabs)/index.tsx` | Mark classes, see overall %, tasks due soon |
| Subjects | `app/(tabs)/subjects.tsx` | All subjects with status; add subject |
| Timetable | `app/(tabs)/timetable.tsx` | View/edit weekly timetable; scan |
| Tasks | `app/(tabs)/tasks.tsx` | To-do list for assignments |
| Settings | `app/(tabs)/settings.tsx` | Target, semester, account |

Other routes: `app/subject/[id].tsx` (subject detail), `app/onboarding/*` (first run only).
Tab bar: icon + short label. Active tab uses the primary accent.

---

## 3. Auth & onboarding

### 3.1 Auth screen (`app/(auth)/sign-in.tsx`)
- Shown whenever there is no valid session. Nothing else is reachable.
- Content: app name, one-line promise ("Know exactly how many classes you can skip."), 3 short benefit lines, then:
  1. **Continue with Google** (primary button) — Supabase OAuth via `expo-web-browser`.
  2. **Continue with email** — user enters email → receives a 6-digit code → enters it (Supabase email OTP). No passwords.
- Links: Privacy Policy, Terms (open in browser).
- Errors in plain language ("That code didn't work. Check it and try again.").
- Session is persisted; reopening the app while offline must still open the app (use the stored session; refresh tokens when online).

### 3.2 Onboarding (first sign-in only, `profile.onboarded = 0`)
Three short steps with a progress indicator. Back is allowed. Skippable where noted.

1. **Target** — "What's the minimum attendance your college requires?" Stepper/slider 1–100, default 75, big number. Saves to `profile.target_pct`.
2. **Subjects** — "Add your subjects." Uses the **persistent quick-add input** pattern (same as tasks, §6.2): type a name → Enter → it's added and the input stays focused. Each added subject appears in a list below with two small optional number fields: **"Attended"** and **"Out of"** (opening balance, default 0 / 0). Validation: attended ≤ out of; show inline error otherwise. Color auto-assigned from the palette. Requires ≥ 1 subject to continue.
3. **Timetable** — three buttons: **Scan a photo** (§7.2), **Add manually** (§7.1), **Skip for now**.

Finish → set `onboarded = 1` → Today. Ask for notification permission here (one sentence explaining why: "so we can ask whether you attended after each class"). If denied, continue silently.

---

## 4. Today screen

Purpose: mark attendance fast.

### 4.1 Layout (top → bottom)
1. **Date bar:** "Sunday, 1 Nov" with ◀ ▶ arrows to change day. "Today" chip jumps back when not on today. Cannot navigate/mark **future** dates (▶ disabled when on today).
2. **Overall card:** big overall percentage (sum of all subjects' counts via `sumCounts`), "Target {target}%", a thin progress bar with the target tick, and `statusMessage(overallCounts, target)`. If no data: "—" and "Mark your first class to see your numbers."
3. **Classes list** for the selected date (from `slotsForDate`, earliest first).
4. **"+ Extra class"** text button under the list (§4.3).
5. **Due soon** strip: up to 3 tasks from `dueSoon()` with checkboxes, "See all" → Tasks tab. Hidden when empty.

### 4.2 Class row
`[color dot] Subject name        09:00 – 10:00 AM        [✓] [✗]`
Second line (muted): the subject's current percentage `formatPercentage` and its risk chip (safe/warning/danger colours).

- **Unmarked row:** both buttons outlined. Under the row, one muted hint line: `If you skip: 76.6% · still safe` or `If you skip: 74.1% · below target` — computed with `simulate(counts, {skip: 1}, target)`. This is the inline "What if?".
- **Tap ✓** → create record `present` for (slot, date). ✓ becomes filled green.
- **Tap ✗** → create record `absent`. ✗ becomes filled red.
- **Tap the active button again** → remove the record (soft-delete). Row returns to unmarked.
- **Tap the other button** → change status of the existing record.
- Haptic feedback on every mark. Percentages and the overall card update instantly (no spinner).
- A subtle "Undo" snackbar (4 s) appears after every change.
- If the same subject has two slots on the same day, they are two independent rows with independent records.

### 4.3 Extra class
Bottom sheet: pick subject, pick status (✓ / ✗), date defaults to the selected date. Creates a record with `slot_id = NULL`. Extra records appear in the Today list under a small "Extra" label and can be toggled/removed like any other.

### 4.4 Empty states
- No timetable at all: "No timetable yet." + buttons **Scan timetable** / **Add manually**.
- Timetable exists but nothing scheduled that day: "No classes on {weekday}." + "+ Extra class".
- No subjects: send to Subjects tab with "Add your first subject".

### 4.5 Rollover
When the app returns to foreground (`AppState`), recompute "today". If it was showing the old today and the date changed, jump to the new today.

---

## 5. Subjects

### 5.1 Subjects tab
- List of **SubjectCards**, sorted: danger first, then warning, then safe, then no-data; ties by name.
- Card: color dot, name, big `formatPercentage`, `present / total` (e.g. "24 / 31"), risk chip, `statusMessage`.
- "+ Add subject" button (primary, bottom). Opens a sheet: name (required), color, **"Already attended / Out of so far"** (optional opening balance). Duplicate name (case-insensitive) → inline warning, allow override.
- Empty state: "Add your first subject."

### 5.2 Subject detail (`app/subject/[id].tsx`)
Top to bottom:
1. Header: name, color, ⋯ menu (Edit subject, Delete subject).
2. Big percentage, `present / total`, risk chip, `statusMessage`.
3. **What-if simulator card:** two steppers — "Attend next [0] classes" and "Skip next [0] classes" (0–30). Live result from `simulate()`: new percentage (big), counts, and a line "Above target ✓" or "Below target — you'd need N more to recover" (`mustAttend` on the projected counts). A **Reset** button. Never writes anything.
4. **Semester-end card** (only when semester dates are set, §9).
5. **History:** records newest first, grouped by month. Row: date (e.g. "Mon 2 Nov"), status ✓/✗, and tap → sheet to switch status, change date, or delete. "**+ Add past entry**" → pick date + status (no slot link).
6. Opening balance line: "Started with 23 / 29" with an edit action.

### 5.3 Edit / delete
- Edit: rename, color, opening balance (validate attended ≤ out of).
- Delete subject: confirm dialog "Delete {name}? Its attendance history and timetable slots will be removed." On confirm: soft-delete the subject, its slots and its records; unlink its tasks (`subject_id = NULL`). Undo snackbar 6 s that restores everything deleted in that action.

---

## 6. Tasks

### 6.1 List
Grouped sections in this order using `groupTasks()`: **Overdue** (red label), **Today**, **Tomorrow**, **Upcoming**, **No date**, **Done** (collapsed by default, count shown, "Clear done" action at its end with confirm).
Row: checkbox, title (wraps up to 2 lines), due chip ("Tomorrow", "Fri 6 Nov", "Overdue 2d"), subject chip (color dot + name) if linked.

- Tap checkbox → toggle done (`done_at` set/cleared). Done rows show strikethrough and move to Done.
- Tap row (not checkbox) → edit sheet: title, due date, subject, **Delete** (undo snackbar).
- Empty state: "No tasks yet. Tap + to add your first assignment."

### 6.2 Quick-add composer (REQUIRED BEHAVIOUR)
The goal: type many tasks back-to-back without re-opening anything.

1. Floating **"+ Add task"** button at bottom right of the Tasks screen.
2. Tapping it opens a **composer bar docked above the keyboard**: a text input (auto-focused, placeholder "What do you need to do?") with a **send button (↑)** at its right, and below it a row of optional chips: **Today · Tomorrow · Pick date · Subject ▾**.
3. **Submit** via the send button OR the keyboard's Enter/Send key (`returnKeyType="send"`, `blurOnSubmit={false}`).
4. On submit:
   - `normalizeTitle(text)`; if `null` → do nothing, keep focus, no error.
   - Otherwise create the task immediately (offline-safe), **clear the text, keep the input focused and the keyboard open**, so the next task can be typed straight away. The composer does NOT close.
   - The new task appears in the list above the composer (list scrolls to it; brief highlight).
5. **Chip behaviour (owner can change this):** the chosen due date and subject **stay selected for the next task** and are shown highlighted, so entering four assignments due Friday needs the date set once. They reset when the composer closes.
6. **Closing the composer:** tap ✕, tap the list area, or press hardware Back. Keyboard dismisses.
7. Multi-line paste: if pasted text contains line breaks, offer "Add as N tasks?" (one task per non-empty line). Optional; build last.

### 6.3 Home integration
`dueSoon()` feeds the Today screen strip (§4.1.5). No notifications for tasks in the first release.

---

## 7. Timetable

### 7.1 Manual editor (build this BEFORE scanning)
- **Day chips** Mon–Sun at the top. Selected day shows its slots (`groupByWeekday`), earliest first: `09:00 – 10:00 AM · Subject · Room`.
- **"+ Add class"** → bottom sheet:
  - Subject picker (list of subjects + "New subject…" inline).
  - **Days:** multi-select chips Mon–Sun (select Mon+Wed+Fri to create three slots at once). When editing an existing slot, single day only.
  - Start time, End time (native time pickers; 12-hour display, stored `HH:MM`).
  - Room (optional).
  - Validate with `validateSlot()`; show its message under the field.
  - Overlap check with `conflictsWith()`: show an amber warning "Overlaps with {Subject} {time}." but **allow saving**.
- Tap a slot → same sheet in edit mode with **Delete** (undo snackbar). Deleting a slot keeps its past records (they still count).
- Quick action: **Copy day** → pick another day(s) to duplicate this day's slots to.
- Empty state: "No classes on {day}." + "+ Add class".
- Header actions: **Scan** (camera icon).
- After any timetable change, reschedule notifications (§8).

### 7.2 Scan / upload flow
Entry points: onboarding step 3, empty states, Timetable header.

1. **Source:** action sheet — **Take photo**, **Choose from gallery**. (PDF: tell the user to screenshot it. No PDF support in v1.)
2. **Prepare:** resize to max 1600 px on the long side, JPEG quality 0.7 (needs `expo-image-manipulator` — ask the owner before adding). Convert to base64.
3. **Call** the `scan-timetable` edge function (`supabase.functions.invoke`) with `{ image_base64, mime }`. Show a full-screen loader: "Reading your timetable… this takes a few seconds." Cancel button.
4. **Errors:** offline → "Scanning needs internet. You can add classes manually." 429 → show server message (daily limit). 502/timeouts → "Couldn't read it. Try a clearer, straight-on photo." Always offer **Add manually** as the fallback.
5. **Review screen (the important part):** list grouped by weekday. Each row shows subject, time range, room. Rows where `confidence = "low"` have an amber left border and a "Check this" label. Every row is tappable → the same edit sheet as §7.1 (subject, day, times, room, delete). "+ Add missing class" at the bottom. Warnings from the function are listed at the top ("Row 4: skipped (invalid time)").
6. **Subject matching:** for each distinct scanned subject name, match to an existing subject (case-insensitive, trimmed, exact match first, then "contains" match). Unmatched names are shown in a "New subjects" section: each can be **renamed**, **merged into an existing subject** (picker) or **left as new**. New subjects are created with opening balance 0/0.
7. **Save:** if the timetable already has slots, ask **Replace** (soft-delete existing slots) or **Add to existing**. Then write all slots (+ new subjects) in one transaction. Show "Saved {N} classes".
8. Nothing is saved until the student taps Save. Backing out discards the scan (confirm dialog).
9. The function limits each user to **5 scans per day**; show remaining scans on the source sheet when known.

---

## 8. Notifications (local only)

- Library: `expo-notifications`. Permission asked once at end of onboarding (§3.2); also available via Settings toggle.
- **Class check-in:** for each slot, one weekly repeating local notification at the slot's `end_time`: title "Did you attend {Subject}?", with action buttons **Present** / **Absent**. Tapping an action creates/updates the record for (slot, that date). Tapping the notification body opens Today.
- Reschedule everything (cancel all + schedule) whenever slots, subjects or the notification toggle change, and on app start.
- Settings toggle: "Class reminders" on/off.
- **Known risk:** notification action buttons and scheduled notifications may not behave in Expo Go on Android. If so, the owner will use a development build. Do not hack around it; report what works.
- **Not in the first release:** task reminders.

---

## 9. Semester-end projection

Needs: `semester_end` set (and `semester_start` optional), timetable slots, optional holidays.

- Subject detail card: **"By {end date}"**
  - remaining = `countRemainingBySubject(slots, fromKey, semesterEnd, holidaySet)[subjectId] ?? 0`, where `fromKey` = today if today has unmarked slots for this subject, else tomorrow. (Simplest acceptable v1: count from tomorrow, plus today's slots not yet marked.)
  - result = `semesterProjection(counts, target, remaining)`.
  - Reachable: "Attend at least **{minAttend}** of your next **{remaining}** classes. You can skip up to **{maxSkip}**." plus best-case %.
  - Not reachable: "Even attending every remaining class, you'll finish at {maxAchievablePercentage}%. {target}% isn't reachable this semester."
  - Caption (always): "Based on your timetable and the classes you've marked."
- No semester end set: show a card "Set your semester end date to see this" → Settings.
- Settings has **Semester dates** and **Holidays** (list of dates + optional label; add/remove).

---

## 10. Settings

Sections:
1. **Account:** name (editable), email (read-only).
2. **Attendance:** **Target %** stepper (1–100). Changing it recalculates everything instantly; show current value large.
3. **Semester:** start date, end date, Holidays list.
4. **Notifications:** Class reminders toggle.
5. **Appearance:** System / Light / Dark.
6. **Data:** sync status line ("Synced just now" / "Offline — will sync later" / "Syncing…").
7. **Legal:** Privacy Policy, Terms, app version.
8. **Account actions:** **Sign out** (confirm; wipes local data — it's safe because everything is on the server; warn if unsynced changes exist: "You have changes that haven't synced. Sign out anyway?"). **Delete account** (required by Google Play): confirm dialog where the user must type `DELETE`; calls `supabase.rpc('delete_my_account')`, wipes local DB, returns to the auth screen.

---

## 11. Edge cases (all must be handled)

| Case | Behaviour |
|---|---|
| Subject has 0 records and 0/0 opening | Percentage "—", message "Mark your first class…", risk `no-data`; it adds 0 to the overall figure |
| Target 100 | `mustAttend` null → "100% can't be reached anymore." Never show Infinity/NaN |
| Marking a date in the future | Disabled |
| Marking a slot twice for the same date | Impossible (unique index); tapping toggles |
| Slot deleted after records exist | Records stay and still count; history still shows them |
| Subject deleted | Cascade soft-delete per §5.3; tasks unlinked |
| Changing target | All figures recompute from stored counts; nothing stored needs migration |
| Editing opening balance below existing derived counts | Allowed; it is just the baseline. Validate only `present ≤ total` |
| Midnight rollover while app open | §4.5 |
| Device timezone change | Dates are local day keys; existing records keep their stored date |
| Two devices edit the same row | Last write (by `updated_at`) wins — see `DATA_MODEL.md` |
| Very long subject / task names | Truncate with ellipsis in lists, full text in edit sheets |
| Large numbers (hundreds of records) | Lists virtualized; counts via SQL aggregate, not by loading all records into JS for the Today screen |
| No internet | Everything works except sign-in, first sync, scan; show subtle offline indicator in Settings only (no nagging banners) |

---

## 12. Google Play requirements (do before publishing)

- In-app **account deletion** (§10) + a public web page describing how to delete the account and data.
- Public **privacy policy** URL; complete the **Data safety** form (email, name, attendance data, task data are collected; encrypted in transit).
- Because sign-in is mandatory, **provide a test account** to Google reviewers in App access.
- Target API level and 64-bit requirements are handled by EAS/Expo builds; build an **AAB** with `eas build -p android --profile production`.
