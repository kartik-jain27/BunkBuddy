/**
 * attendance.ts — ALL attendance math lives here. Screens must never inline it.
 *
 * Model (locked product decisions):
 *  - A class is either PRESENT or ABSENT. No other status exists.
 *  - No entry for a class = it did not happen as far as the app is concerned.
 *  - total = present + absent. Percentage = present / total.
 *  - One global target (integer percent, 1..100) applies to every subject.
 *  - Labs are normal subjects: one tick = one class.
 *
 * Everything here is pure (no I/O, no Date, no randomness) and uses integer
 * arithmetic for threshold checks so floating point never flips a result.
 */

export type AttendanceStatus = 'present' | 'absent';

/** present = classes attended, total = classes counted (present + absent). */
export interface Counts {
  present: number;
  total: number;
}

export type RiskLevel = 'no-data' | 'safe' | 'warning' | 'danger';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function isValidTarget(target: number): boolean {
  return Number.isInteger(target) && target >= 1 && target <= 100;
}

function assertTarget(target: number): void {
  if (!isValidTarget(target)) {
    throw new RangeError(`target must be an integer between 1 and 100, got ${target}`);
  }
}

function assertCounts(c: Counts): void {
  if (
    !Number.isInteger(c.present) ||
    !Number.isInteger(c.total) ||
    c.present < 0 ||
    c.total < 0 ||
    c.present > c.total
  ) {
    throw new RangeError(
      `invalid counts: present=${c.present}, total=${c.total} (need 0 <= present <= total, integers)`,
    );
  }
}

function assertCount(n: number, name: string): void {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(`${name} must be a non-negative integer, got ${n}`);
  }
}

// ---------------------------------------------------------------------------
// Building counts
// ---------------------------------------------------------------------------

/** Opening balance + logged records for one subject. */
export function deriveCounts(
  opening: Counts,
  records: ReadonlyArray<{ status: AttendanceStatus }>,
): Counts {
  assertCounts(opening);
  let present = opening.present;
  let total = opening.total;
  for (const r of records) {
    total += 1;
    if (r.status === 'present') present += 1;
  }
  return { present, total };
}

/** Sum of several subjects — used for the overall figure. */
export function sumCounts(list: ReadonlyArray<Counts>): Counts {
  let present = 0;
  let total = 0;
  for (const c of list) {
    assertCounts(c);
    present += c.present;
    total += c.total;
  }
  return { present, total };
}

// ---------------------------------------------------------------------------
// Percentage
// ---------------------------------------------------------------------------

/** Raw percentage 0..100, or null when nothing has been recorded yet. */
export function percentage(c: Counts): number | null {
  assertCounts(c);
  if (c.total === 0) return null;
  return (c.present / c.total) * 100;
}

/**
 * Display string. TRUNCATES (never rounds up) so a student at 74.996% is never
 * shown "75.0%" while actually being below a 75% target. Null → "—".
 * Uses integer math: floor(present * 100 * 10^d / total) / 10^d.
 */
export function formatPercentage(c: Counts, decimals = 1): string {
  assertCounts(c);
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 4) {
    throw new RangeError('decimals must be an integer between 0 and 4');
  }
  if (c.total === 0) return '—';
  const scale = 10 ** decimals;
  const scaled = Math.floor((c.present * 100 * scale) / c.total);
  return (scaled / scale).toFixed(decimals);
}

// ---------------------------------------------------------------------------
// Target checks
// ---------------------------------------------------------------------------

/** True when present/total >= target%. With no data there is nothing to fail → true. */
export function meetsTarget(c: Counts, target: number): boolean {
  assertCounts(c);
  assertTarget(target);
  if (c.total === 0) return true;
  return c.present * 100 >= target * c.total;
}

/**
 * Max number of upcoming classes that can be skipped (marked absent) while
 * staying at or above the target. 0 if already below target or no data.
 *
 * Derivation (P = target as integer percent):
 *   present*100 >= P*(total + x)  =>  x <= (100*present - P*total) / P
 */
export function canBunk(c: Counts, target: number): number {
  assertCounts(c);
  assertTarget(target);
  if (c.total === 0) return 0;
  const numerator = 100 * c.present - target * c.total;
  if (numerator < 0) return 0;
  return Math.floor(numerator / target);
}

/**
 * Min number of consecutive classes that must be attended to reach the target.
 * 0 if already meeting it. null if impossible (target 100% but an absence exists).
 *
 * Derivation:
 *   (present + y)*100 >= P*(total + y)  =>  y >= (P*total - 100*present) / (100 - P)
 */
export function mustAttend(c: Counts, target: number): number | null {
  assertCounts(c);
  assertTarget(target);
  const deficit = target * c.total - 100 * c.present;
  if (deficit <= 0) return 0;
  if (target === 100) return null; // can never recover from an absence
  return Math.ceil(deficit / (100 - target));
}

/**
 * Traffic-light status for a subject card.
 *  no-data : nothing recorded
 *  danger  : below target
 *  warning : at/above target but cannot afford to miss even one class
 *  safe    : can bunk at least one class
 */
export function riskLevel(c: Counts, target: number): RiskLevel {
  assertCounts(c);
  assertTarget(target);
  if (c.total === 0) return 'no-data';
  if (!meetsTarget(c, target)) return 'danger';
  return canBunk(c, target) >= 1 ? 'safe' : 'warning';
}

// ---------------------------------------------------------------------------
// "What if?" simulator
// ---------------------------------------------------------------------------

export interface Scenario {
  /** Number of upcoming classes you attend. */
  attend?: number;
  /** Number of upcoming classes you skip. */
  skip?: number;
}

export interface Projection {
  counts: Counts;
  /** Raw percentage, null if total is 0. */
  percentage: number | null;
  meetsTarget: boolean;
}

/** Pure projection. Never touches stored records. */
export function simulate(c: Counts, scenario: Scenario, target: number): Projection {
  assertCounts(c);
  assertTarget(target);
  const attend = scenario.attend ?? 0;
  const skip = scenario.skip ?? 0;
  assertCount(attend, 'attend');
  assertCount(skip, 'skip');
  const counts: Counts = {
    present: c.present + attend,
    total: c.total + attend + skip,
  };
  return {
    counts,
    percentage: percentage(counts),
    meetsTarget: meetsTarget(counts, target),
  };
}

// ---------------------------------------------------------------------------
// Semester-end projection
// ---------------------------------------------------------------------------

export interface SemesterProjection {
  /** Best possible final percentage if every remaining class is attended. null if no classes at all. */
  maxAchievablePercentage: number | null;
  /** Can the target still be reached by the end of the semester? */
  reachable: boolean;
  /** Minimum remaining classes that must be attended. null when unreachable. */
  minAttend: number | null;
  /** Maximum remaining classes that can be skipped. 0 when unreachable. */
  maxSkip: number;
}

/**
 * @param remaining number of classes still scheduled for this subject between
 *                  today and the semester end (holidays already excluded).
 */
export function semesterProjection(
  c: Counts,
  target: number,
  remaining: number,
): SemesterProjection {
  assertCounts(c);
  assertTarget(target);
  assertCount(remaining, 'remaining');

  const finalTotal = c.total + remaining;
  const maxAchievablePercentage =
    finalTotal === 0 ? null : ((c.present + remaining) / finalTotal) * 100;

  // Need (present + y) * 100 >= target * finalTotal  =>  y >= (target*finalTotal - 100*present) / 100
  const needed = Math.max(0, Math.ceil((target * finalTotal - 100 * c.present) / 100));
  const reachable = needed <= remaining;

  return {
    maxAchievablePercentage,
    reachable,
    minAttend: reachable ? needed : null,
    maxSkip: reachable ? remaining - needed : 0,
  };
}

// ---------------------------------------------------------------------------
// Status sentence shown on subject cards and the subject detail screen
// ---------------------------------------------------------------------------

function plural(n: number): string {
  return n === 1 ? 'class' : 'classes';
}

/** The one-line, student-friendly sentence under a subject's percentage. */
export function statusMessage(c: Counts, target: number): string {
  switch (riskLevel(c, target)) {
    case 'no-data':
      return 'Mark your first class to see your numbers.';
    case 'warning':
      return "On the edge — don't skip the next class.";
    case 'safe': {
      const n = canBunk(c, target);
      return `You can skip ${n} more ${plural(n)}.`;
    }
    case 'danger': {
      const n = mustAttend(c, target);
      if (n === null) return `${target}% can't be reached anymore.`;
      return `Attend the next ${n} ${plural(n)} to reach ${target}%.`;
    }
  }
}
