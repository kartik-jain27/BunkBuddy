import {
  addDays,
  formatTime12h,
  isoWeekday,
  isValidDateKey,
  isValidTime,
  parseDateKey,
  timeToMinutes,
  toDateKey,
  weekdayName,
} from './dates';

describe('toDateKey / parseDateKey', () => {
  it('uses the local calendar day', () => {
    expect(toDateKey(new Date(2026, 10, 1, 23, 59))).toBe('2026-11-01');
    expect(toDateKey(new Date(2026, 10, 2, 0, 1))).toBe('2026-11-02');
  });
  it('round-trips', () => {
    expect(toDateKey(parseDateKey('2026-02-28'))).toBe('2026-02-28');
  });
  it('rejects impossible dates', () => {
    expect(isValidDateKey('2026-02-30')).toBe(false);
    expect(isValidDateKey('2026-13-01')).toBe(false);
    expect(isValidDateKey('26-01-01')).toBe(false);
    expect(() => parseDateKey('nope')).toThrow(RangeError);
  });
});

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('isoWeekday', () => {
  it('Monday = 1, Sunday = 7', () => {
    expect(isoWeekday(new Date(2026, 10, 1))).toBe(7); // Sunday 1 Nov 2026
    expect(isoWeekday(new Date(2026, 10, 2))).toBe(1); // Monday
    expect(isoWeekday(new Date(2026, 10, 7))).toBe(6); // Saturday
  });
});

describe('time helpers', () => {
  it('validates HH:MM', () => {
    expect(isValidTime('09:30')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('9:30')).toBe(false);
    expect(isValidTime('09:60')).toBe(false);
  });
  it('converts to minutes', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('09:30')).toBe(570);
    expect(() => timeToMinutes('bad')).toThrow(RangeError);
  });
  it('formats 12-hour labels', () => {
    expect(formatTime12h('00:05')).toBe('12:05 AM');
    expect(formatTime12h('09:30')).toBe('9:30 AM');
    expect(formatTime12h('12:00')).toBe('12:00 PM');
    expect(formatTime12h('15:45')).toBe('3:45 PM');
  });
  it('names weekdays', () => {
    expect(weekdayName(1)).toBe('Monday');
    expect(weekdayName(7)).toBe('Sunday');
    expect(() => weekdayName(0)).toThrow(RangeError);
  });
});
