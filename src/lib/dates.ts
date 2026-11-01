/**
 * dates.ts — date/time helpers. The app stores:
 *   dates  as 'YYYY-MM-DD' (the user's LOCAL calendar day, never UTC)
 *   times  as 'HH:MM' 24-hour
 *   weekday as ISO number: 1 = Monday ... 7 = Sunday
 *
 * Never build date keys with toISOString() — that converts to UTC and gives
 * the wrong day for Indian users late in the evening / early morning.
 */

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidDateKey(key: string): boolean {
  const m = DATE_KEY_RE.exec(key);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d;
}

/** Local calendar day of a Date as 'YYYY-MM-DD'. */
export function toDateKey(d: Date): string {
  const y = String(d.getFullYear()).padStart(4, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 'YYYY-MM-DD' → Date at local midnight. Throws on invalid input. */
export function parseDateKey(key: string): Date {
  if (!isValidDateKey(key)) throw new RangeError(`invalid date key: ${key}`);
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Add (or subtract) whole days to a date key. */
export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** ISO weekday: Monday = 1 ... Sunday = 7. */
export function isoWeekday(d: Date): number {
  const js = d.getDay(); // 0 = Sunday
  return js === 0 ? 7 : js;
}

export function isValidTime(t: string): boolean {
  return TIME_RE.test(t);
}

/** 'HH:MM' → minutes since midnight. Throws on invalid input. */
export function timeToMinutes(t: string): number {
  const m = TIME_RE.exec(t);
  if (!m) throw new RangeError(`invalid time: ${t}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/** 'HH:MM' (24h) → '9:05 AM' style label for display. */
export function formatTime12h(t: string): string {
  const minutes = timeToMinutes(t);
  const h24 = Math.floor(minutes / 60);
  const mm = String(minutes % 60).padStart(2, '0');
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm} ${suffix}`;
}

export const WEEKDAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

/** ISO weekday (1..7) → name. */
export function weekdayName(weekday: number): string {
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
    throw new RangeError(`invalid weekday: ${weekday}`);
  }
  return WEEKDAY_NAMES[weekday - 1];
}
