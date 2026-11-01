import { dueSoon, groupTasks, normalizeTitle, type Task } from './tasks';

const task = (over: Partial<Task> & { id: string }): Task => ({
  title: 't',
  dueDate: null,
  subjectId: null,
  done: false,
  createdAt: '2026-11-01T10:00:00.000Z',
  doneAt: null,
  ...over,
});

describe('normalizeTitle', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeTitle('  DBMS   assignment \n 3 ')).toBe('DBMS assignment 3');
  });
  it('returns null for empty input', () => {
    expect(normalizeTitle('')).toBeNull();
    expect(normalizeTitle('   \n ')).toBeNull();
  });
  it('caps very long titles', () => {
    expect(normalizeTitle('a'.repeat(500))).toHaveLength(200);
  });
});

describe('groupTasks', () => {
  const today = '2026-11-01';
  const tasks: Task[] = [
    task({ id: 'over', dueDate: '2026-10-30' }),
    task({ id: 'today', dueDate: '2026-11-01' }),
    task({ id: 'tom', dueDate: '2026-11-02' }),
    task({ id: 'later', dueDate: '2026-11-20' }),
    task({ id: 'nodate' }),
    task({ id: 'done1', done: true, dueDate: '2026-10-01', doneAt: '2026-10-02T00:00:00.000Z' }),
    task({ id: 'done2', done: true, doneAt: '2026-10-05T00:00:00.000Z' }),
  ];

  it('puts each task in the right group', () => {
    const g = groupTasks(tasks, today);
    expect(g.overdue.map((t) => t.id)).toEqual(['over']);
    expect(g.today.map((t) => t.id)).toEqual(['today']);
    expect(g.tomorrow.map((t) => t.id)).toEqual(['tom']);
    expect(g.upcoming.map((t) => t.id)).toEqual(['later']);
    expect(g.noDate.map((t) => t.id)).toEqual(['nodate']);
  });

  it('done tasks never appear in other groups, newest completion first', () => {
    const g = groupTasks(tasks, today);
    expect(g.done.map((t) => t.id)).toEqual(['done2', 'done1']);
    expect(g.overdue.find((t) => t.id === 'done1')).toBeUndefined();
  });

  it('keeps every group key even when empty', () => {
    const g = groupTasks([], today);
    expect(Object.keys(g).sort()).toEqual(
      ['done', 'noDate', 'overdue', 'today', 'tomorrow', 'upcoming'].sort(),
    );
  });

  it('sorts by due date then creation order', () => {
    const g = groupTasks(
      [
        task({ id: 'b', dueDate: '2026-11-10', createdAt: '2026-11-01T09:00:00.000Z' }),
        task({ id: 'a', dueDate: '2026-11-05' }),
        task({ id: 'c', dueDate: '2026-11-10', createdAt: '2026-11-01T08:00:00.000Z' }),
      ],
      today,
    );
    expect(g.upcoming.map((t) => t.id)).toEqual(['a', 'c', 'b']);
  });

  it('handles month rollover for "tomorrow"', () => {
    const g = groupTasks([task({ id: 'x', dueDate: '2026-12-01' })], '2026-11-30');
    expect(g.tomorrow.map((t) => t.id)).toEqual(['x']);
  });
});

describe('dueSoon', () => {
  it('returns overdue, today and tomorrow only (not done, not later)', () => {
    const list = [
      task({ id: 'over', dueDate: '2026-10-30' }),
      task({ id: 'today', dueDate: '2026-11-01' }),
      task({ id: 'tom', dueDate: '2026-11-02' }),
      task({ id: 'later', dueDate: '2026-11-20' }),
      task({ id: 'nodate' }),
      task({ id: 'done', dueDate: '2026-11-01', done: true }),
    ];
    expect(dueSoon(list, '2026-11-01').map((t) => t.id)).toEqual(['over', 'today', 'tom']);
  });
});
