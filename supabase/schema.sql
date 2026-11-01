-- =============================================================================
-- Supabase schema for the attendance app.
-- Run once in the Supabase SQL editor (or as supabase/migrations/0001_init.sql).
--
-- Design rules:
--   * Every table is owned by one user (user_id) and locked by Row Level Security.
--   * Ids are UUIDs generated ON THE DEVICE so offline writes never collide.
--   * updated_at   = client clock, used for "newer wins" on the device.
--   * synced_at    = server clock (trigger), used as the pull cursor. Never trust client for this.
--   * Deletes are soft (deleted_at) so other devices learn about them.
--   * No percentage columns anywhere. Percentages are always computed.
-- =============================================================================

-- ---------------------------------------------------------------- helpers ---

create or replace function public.set_synced_at()
returns trigger
language plpgsql
as $$
begin
  new.synced_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- profiles ---

create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  target_pct      integer not null default 75 check (target_pct between 1 and 100),
  semester_start  date,
  semester_end    date,
  onboarded       boolean not null default false,
  -- monetisation hook (free-tier gating later): 'free' | 'pro'
  plan            text not null default 'free' check (plan in ('free', 'pro')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  synced_at       timestamptz not null default now()
);

-- Auto-create the profile row when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- subjects ---

create table public.subjects (
  id               uuid primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null check (length(btrim(name)) > 0),
  color            text not null default '#7C3AED',
  initial_present  integer not null default 0 check (initial_present >= 0),
  initial_total    integer not null default 0 check (initial_total >= 0),
  sort_order       integer not null default 0,
  created_at       timestamptz not null,
  updated_at       timestamptz not null,
  deleted_at       timestamptz,
  synced_at        timestamptz not null default now(),
  check (initial_present <= initial_total)
);
create index subjects_user_synced_idx on public.subjects (user_id, synced_at);

-- ---------------------------------------------------------- timetable_slots ---

create table public.timetable_slots (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  subject_id  uuid not null references public.subjects(id) on delete cascade,
  weekday     integer not null check (weekday between 1 and 7),  -- 1 = Monday ... 7 = Sunday
  start_time  time not null,
  end_time    time not null,
  room        text,
  created_at  timestamptz not null,
  updated_at  timestamptz not null,
  deleted_at  timestamptz,
  synced_at   timestamptz not null default now(),
  check (end_time > start_time)
);
create index slots_user_synced_idx on public.timetable_slots (user_id, synced_at);

-- ------------------------------------------------------ attendance_records ---

create table public.attendance_records (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  subject_id  uuid not null references public.subjects(id) on delete cascade,
  slot_id     uuid references public.timetable_slots(id) on delete set null,
  date        date not null,
  status      text not null check (status in ('present', 'absent')),
  created_at  timestamptz not null,
  updated_at  timestamptz not null,
  deleted_at  timestamptz,
  synced_at   timestamptz not null default now()
);
create unique index records_slot_date_uq
  on public.attendance_records (slot_id, date)
  where slot_id is not null and deleted_at is null;
create index records_user_synced_idx on public.attendance_records (user_id, synced_at);

-- ------------------------------------------------------------------- tasks ---

create table public.tasks (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null check (length(btrim(title)) > 0),
  due_date    date,
  subject_id  uuid references public.subjects(id) on delete set null,
  done        boolean not null default false,
  done_at     timestamptz,
  created_at  timestamptz not null,
  updated_at  timestamptz not null,
  deleted_at  timestamptz,
  synced_at   timestamptz not null default now()
);
create index tasks_user_synced_idx on public.tasks (user_id, synced_at);

-- ---------------------------------------------------------------- holidays ---

create table public.holidays (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  label       text,
  created_at  timestamptz not null,
  updated_at  timestamptz not null,
  deleted_at  timestamptz,
  synced_at   timestamptz not null default now()
);
create unique index holidays_user_date_uq on public.holidays (user_id, date) where deleted_at is null;
create index holidays_user_synced_idx on public.holidays (user_id, synced_at);

-- -------------------------------------------------------------- scan usage ---
-- Daily counter for timetable image scans (cost control). Written ONLY by the
-- scan-timetable edge function using the service role; clients can read their own row.

create table public.scan_usage (
  user_id  uuid not null references auth.users(id) on delete cascade,
  day      date not null default (now() at time zone 'utc')::date,
  count    integer not null default 0,
  primary key (user_id, day)
);

-- ----------------------------------------------------- synced_at triggers ---

create trigger profiles_synced_at         before insert or update on public.profiles
  for each row execute function public.set_synced_at();
create trigger subjects_synced_at         before insert or update on public.subjects
  for each row execute function public.set_synced_at();
create trigger timetable_slots_synced_at  before insert or update on public.timetable_slots
  for each row execute function public.set_synced_at();
create trigger attendance_synced_at       before insert or update on public.attendance_records
  for each row execute function public.set_synced_at();
create trigger tasks_synced_at            before insert or update on public.tasks
  for each row execute function public.set_synced_at();
create trigger holidays_synced_at         before insert or update on public.holidays
  for each row execute function public.set_synced_at();

-- ------------------------------------------------------- row level security ---

alter table public.profiles            enable row level security;
alter table public.subjects            enable row level security;
alter table public.timetable_slots     enable row level security;
alter table public.attendance_records  enable row level security;
alter table public.tasks               enable row level security;
alter table public.holidays            enable row level security;
alter table public.scan_usage          enable row level security;

create policy "own profile"  on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "own subjects" on public.subjects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own slots" on public.timetable_slots
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own records" on public.attendance_records
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own tasks" on public.tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own holidays" on public.holidays
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- clients may only READ their scan counter; the edge function writes with the service role
create policy "read own scan usage" on public.scan_usage
  for select using (user_id = auth.uid());

-- Stop users from upgrading their own plan from the client.
-- A column-level REVOKE does nothing while a table-level UPDATE grant exists, so
-- remove the table-level grants first, then grant UPDATE only on the safe columns.
-- (Profile rows are created by the signup trigger, so clients never INSERT.)
-- 'plan' is changed only by the service role (payment webhook) later.
revoke insert, update on public.profiles from authenticated;
grant update (display_name, target_pct, semester_start, semester_end, onboarded, updated_at)
  on public.profiles to authenticated;

-- ------------------------------------------------------ account deletion ----
-- Required by Google Play: users must be able to delete their account in-app.
-- Cascades remove every row above. Call with supabase.rpc('delete_my_account').

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
