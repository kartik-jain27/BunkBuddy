import {
  mapHolidayRow,
  mapProfileRow,
  mapRecordRow,
  mapSlotRow,
  mapSubjectRow,
  mapSubjectWithCountsRow,
  mapTaskRow,
  type AttendanceRecordRow,
  type HolidayRow,
  type ProfileRow,
  type SlotRow,
  type SubjectRow,
  type SubjectWithCountsRow,
  type TaskRow,
} from './mappers';

const subjectRow: SubjectRow = {
  id: 'sub-1',
  name: 'DBMS',
  color: '#7C3AED',
  initial_present: 23,
  initial_total: 29,
  sort_order: 2,
  created_at: '2026-11-01T10:00:00.000Z',
  updated_at: '2026-11-01T11:00:00.000Z',
};

describe('mapSubjectRow', () => {
  it('maps snake_case to camelCase', () => {
    expect(mapSubjectRow(subjectRow)).toEqual({
      id: 'sub-1',
      name: 'DBMS',
      color: '#7C3AED',
      initialPresent: 23,
      initialTotal: 29,
      sortOrder: 2,
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-01T11:00:00.000Z',
    });
  });
});

describe('mapSubjectWithCountsRow', () => {
  it('keeps the derived counts', () => {
    const row: SubjectWithCountsRow = { ...subjectRow, present: 24, total: 31 };
    const mapped = mapSubjectWithCountsRow(row);
    expect(mapped.present).toBe(24);
    expect(mapped.total).toBe(31);
    expect(mapped.name).toBe('DBMS');
  });

  it('keeps a 0 / 0 subject (no data)', () => {
    const row: SubjectWithCountsRow = {
      ...subjectRow,
      initial_present: 0,
      initial_total: 0,
      present: 0,
      total: 0,
    };
    const mapped = mapSubjectWithCountsRow(row);
    expect(mapped.present).toBe(0);
    expect(mapped.total).toBe(0);
  });
});

describe('mapSlotRow', () => {
  it('renames start/end times and keeps the room', () => {
    const row: SlotRow = {
      id: 'slot-1',
      subject_id: 'sub-1',
      weekday: 1,
      start_time: '09:00',
      end_time: '10:00',
      room: 'LH-2',
    };
    expect(mapSlotRow(row)).toEqual({
      id: 'slot-1',
      subjectId: 'sub-1',
      weekday: 1,
      start: '09:00',
      end: '10:00',
      room: 'LH-2',
    });
  });

  it('maps a missing room to null', () => {
    const row: SlotRow = {
      id: 'slot-2',
      subject_id: 'sub-1',
      weekday: 3,
      start_time: '11:00',
      end_time: '12:00',
      room: null,
    };
    expect(mapSlotRow(row).room).toBeNull();
  });
});

describe('mapRecordRow', () => {
  it('maps a slot record', () => {
    const row: AttendanceRecordRow = {
      id: 'rec-1',
      subject_id: 'sub-1',
      slot_id: 'slot-1',
      date: '2026-11-01',
      status: 'present',
    };
    expect(mapRecordRow(row)).toEqual({
      id: 'rec-1',
      subjectId: 'sub-1',
      slotId: 'slot-1',
      date: '2026-11-01',
      status: 'present',
    });
  });

  it('keeps slotId null for an extra class', () => {
    const row: AttendanceRecordRow = {
      id: 'rec-2',
      subject_id: 'sub-1',
      slot_id: null,
      date: '2026-11-01',
      status: 'absent',
    };
    const mapped = mapRecordRow(row);
    expect(mapped.slotId).toBeNull();
    expect(mapped.status).toBe('absent');
  });
});

describe('mapTaskRow', () => {
  it('maps 1 / 0 to a real boolean', () => {
    const row: TaskRow = {
      id: 'task-1',
      title: 'Submit DBMS assignment',
      due_date: '2026-11-06',
      subject_id: 'sub-1',
      done: 1,
      created_at: '2026-11-01T10:00:00.000Z',
      done_at: '2026-11-01T12:00:00.000Z',
    };
    const mapped = mapTaskRow(row);
    expect(mapped.done).toBe(true);
    expect(mapped.doneAt).toBe('2026-11-01T12:00:00.000Z');
    expect(mapped.dueDate).toBe('2026-11-06');
  });

  it('keeps optional fields null and done false', () => {
    const row: TaskRow = {
      id: 'task-2',
      title: 'Read chapter 3',
      due_date: null,
      subject_id: null,
      done: 0,
      created_at: '2026-11-01T10:00:00.000Z',
      done_at: null,
    };
    const mapped = mapTaskRow(row);
    expect(mapped.done).toBe(false);
    expect(mapped.doneAt).toBeNull();
    expect(mapped.dueDate).toBeNull();
    expect(mapped.subjectId).toBeNull();
  });
});

describe('mapProfileRow', () => {
  it('maps onboarded 1 to true and keeps optional fields', () => {
    const row: ProfileRow = {
      id: 'me',
      display_name: 'Kartik',
      target_pct: 75,
      semester_start: '2026-08-01',
      semester_end: '2026-12-15',
      onboarded: 1,
    };
    expect(mapProfileRow(row)).toEqual({
      id: 'me',
      displayName: 'Kartik',
      targetPct: 75,
      semesterStart: '2026-08-01',
      semesterEnd: '2026-12-15',
      onboarded: true,
    });
  });

  it('maps a fresh profile (no name, no semester, onboarded 0)', () => {
    const row: ProfileRow = {
      id: 'me',
      display_name: null,
      target_pct: 75,
      semester_start: null,
      semester_end: null,
      onboarded: 0,
    };
    const mapped = mapProfileRow(row);
    expect(mapped.displayName).toBeNull();
    expect(mapped.semesterEnd).toBeNull();
    expect(mapped.onboarded).toBe(false);
  });
});

describe('mapHolidayRow', () => {
  it('keeps a label', () => {
    const row: HolidayRow = { id: 'hol-1', date: '2026-11-14', label: 'Diwali' };
    expect(mapHolidayRow(row)).toEqual({ id: 'hol-1', date: '2026-11-14', label: 'Diwali' });
  });

  it('keeps a missing label null', () => {
    const row: HolidayRow = { id: 'hol-2', date: '2026-11-15', label: null };
    expect(mapHolidayRow(row).label).toBeNull();
  });
});
