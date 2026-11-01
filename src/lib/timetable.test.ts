import {
  conflictsWith,
  countRemainingBySubject,
  findOverlaps,
  groupByWeekday,
  slotsForDate,
  slotsOverlap,
  validateSlot,
  type Slot,
} from './timetable';

const slot = (
  id: string,
  subjectId: string,
  weekday: number,
  start: string,
  end: string,
): Slot => ({ id, subjectId, weekday, start, end });

describe('validateSlot', () => {
  const ok = { subjectId: 's1', weekday: 1, start: '09:00', end: '10:00' };
  it('accepts a valid slot', () => {
    expect(validateSlot(ok)).toBeNull();
  });
  it('rejects missing subject, bad day, bad times', () => {
    expect(validateSlot({ ...ok, subjectId: '' })).toMatch(/subject/i);
    expect(validateSlot({ ...ok, weekday: 8 })).toMatch(/day/i);
    expect(validateSlot({ ...ok, start: '9am' })).toMatch(/start/i);
    expect(validateSlot({ ...ok, end: '25:00' })).toMatch(/end/i);
  });
  it('rejects end <= start', () => {
    expect(validateSlot({ ...ok, end: '09:00' })).toMatch(/after/i);
    expect(validateSlot({ ...ok, end: '08:00' })).toMatch(/after/i);
  });
});

describe('overlap detection', () => {
  const a = slot('a', 's1', 1, '09:00', '10:00');
  it('detects intersecting ranges on the same day', () => {
    expect(slotsOverlap(a, slot('b', 's2', 1, '09:30', '10:30'))).toBe(true);
    expect(slotsOverlap(a, slot('b', 's2', 1, '08:00', '09:01'))).toBe(true);
    expect(slotsOverlap(a, slot('b', 's2', 1, '09:15', '09:45'))).toBe(true);
  });
  it('touching ends do not overlap', () => {
    expect(slotsOverlap(a, slot('b', 's2', 1, '10:00', '11:00'))).toBe(false);
    expect(slotsOverlap(a, slot('b', 's2', 1, '08:00', '09:00'))).toBe(false);
  });
  it('different days never overlap', () => {
    expect(slotsOverlap(a, slot('b', 's2', 2, '09:00', '10:00'))).toBe(false);
  });
  it('findOverlaps reports each pair once', () => {
    const list = [a, slot('b', 's2', 1, '09:30', '10:30'), slot('c', 's3', 1, '11:00', '12:00')];
    const pairs = findOverlaps(list);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].map((s) => s.id).sort()).toEqual(['a', 'b']);
  });
  it('conflictsWith ignores the slot being edited', () => {
    const list = [a, slot('b', 's2', 1, '11:00', '12:00')];
    expect(conflictsWith({ ...a }, list, 'a')).toHaveLength(0);
    expect(conflictsWith({ ...a }, list)).toHaveLength(1);
  });
});

describe('slotsForDate', () => {
  const list = [
    slot('late', 's1', 1, '14:00', '15:00'),
    slot('early', 's2', 1, '09:00', '10:00'),
    slot('tue', 's3', 2, '09:00', '10:00'),
  ];
  it('returns only that weekday, earliest first', () => {
    const monday = new Date(2026, 10, 2);
    expect(slotsForDate(list, monday).map((s) => s.id)).toEqual(['early', 'late']);
  });
  it('returns [] on a day with no classes (Sunday)', () => {
    expect(slotsForDate(list, new Date(2026, 10, 1))).toEqual([]);
  });
  it('does not mutate the input', () => {
    const copy = [...list];
    slotsForDate(list, new Date(2026, 10, 2));
    expect(list).toEqual(copy);
  });
});

describe('groupByWeekday', () => {
  it('always has keys 1..7', () => {
    const g = groupByWeekday([]);
    expect(Object.keys(g)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
  });
  it('sorts by start time within a day', () => {
    const g = groupByWeekday([
      slot('b', 's1', 3, '11:00', '12:00'),
      slot('a', 's1', 3, '09:00', '10:00'),
    ]);
    expect(g[3].map((s) => s.id)).toEqual(['a', 'b']);
  });
});

describe('countRemainingBySubject', () => {
  // Mon + Wed class for s1, Mon for s2
  const list = [
    slot('1', 's1', 1, '09:00', '10:00'),
    slot('2', 's1', 3, '09:00', '10:00'),
    slot('3', 's2', 1, '10:00', '11:00'),
  ];

  it('counts occurrences across a range (inclusive)', () => {
    // Mon 2 Nov .. Sun 15 Nov 2026 = two full weeks
    const r = countRemainingBySubject(list, '2026-11-02', '2026-11-15');
    expect(r).toEqual({ s1: 4, s2: 2 });
  });

  it('skips holidays', () => {
    const r = countRemainingBySubject(list, '2026-11-02', '2026-11-15', new Set(['2026-11-09']));
    expect(r).toEqual({ s1: 3, s2: 1 });
  });

  it('returns {} when from is after to', () => {
    expect(countRemainingBySubject(list, '2026-11-10', '2026-11-01')).toEqual({});
  });

  it('single-day range', () => {
    expect(countRemainingBySubject(list, '2026-11-02', '2026-11-02')).toEqual({ s1: 1, s2: 1 });
    expect(countRemainingBySubject(list, '2026-11-01', '2026-11-01')).toEqual({});
  });
});
