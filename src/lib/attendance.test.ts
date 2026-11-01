import {
  canBunk,
  deriveCounts,
  formatPercentage,
  isValidTarget,
  meetsTarget,
  mustAttend,
  percentage,
  riskLevel,
  semesterProjection,
  simulate,
  statusMessage,
  sumCounts,
  type Counts,
} from './attendance';

const c = (present: number, total: number): Counts => ({ present, total });

describe('isValidTarget', () => {
  it('accepts integers 1..100 only', () => {
    expect(isValidTarget(75)).toBe(true);
    expect(isValidTarget(1)).toBe(true);
    expect(isValidTarget(100)).toBe(true);
    expect(isValidTarget(0)).toBe(false);
    expect(isValidTarget(101)).toBe(false);
    expect(isValidTarget(74.5)).toBe(false);
    expect(isValidTarget(NaN)).toBe(false);
  });
});

describe('deriveCounts', () => {
  it('adds records on top of the opening balance', () => {
    const result = deriveCounts(c(20, 25), [
      { status: 'present' },
      { status: 'absent' },
      { status: 'present' },
    ]);
    expect(result).toEqual(c(22, 28));
  });

  it('returns the opening balance when there are no records (no entry = no change)', () => {
    expect(deriveCounts(c(20, 25), [])).toEqual(c(20, 25));
    expect(deriveCounts(c(0, 0), [])).toEqual(c(0, 0));
  });

  it('rejects an impossible opening balance', () => {
    expect(() => deriveCounts(c(26, 25), [])).toThrow(RangeError);
    expect(() => deriveCounts(c(-1, 25), [])).toThrow(RangeError);
    expect(() => deriveCounts(c(1.5, 25), [])).toThrow(RangeError);
  });
});

describe('sumCounts', () => {
  it('adds present and total across subjects', () => {
    expect(sumCounts([c(23, 29), c(10, 12), c(0, 0)])).toEqual(c(33, 41));
  });
  it('empty list is zero', () => {
    expect(sumCounts([])).toEqual(c(0, 0));
  });
});

describe('percentage / formatPercentage', () => {
  it('returns null with no data', () => {
    expect(percentage(c(0, 0))).toBeNull();
    expect(formatPercentage(c(0, 0))).toBe('—');
  });

  it('computes plain percentages', () => {
    expect(percentage(c(23, 30))).toBeCloseTo(76.6667, 3);
    expect(percentage(c(3, 4))).toBe(75);
  });

  it('formats exact values without float noise', () => {
    expect(formatPercentage(c(29, 100), 1)).toBe('29.0');
    expect(formatPercentage(c(3, 4), 1)).toBe('75.0');
    expect(formatPercentage(c(3, 4), 0)).toBe('75');
    expect(formatPercentage(c(1, 1), 2)).toBe('100.00');
  });

  it('TRUNCATES instead of rounding up', () => {
    // 23/30 = 76.666...
    expect(formatPercentage(c(23, 30), 1)).toBe('76.6');
    expect(formatPercentage(c(23, 30), 2)).toBe('76.66');
    // 749/1000 = 74.9 — must not show 75
    expect(formatPercentage(c(749, 1000), 0)).toBe('74');
    // 23/31 = 74.193...
    expect(formatPercentage(c(23, 31), 1)).toBe('74.1');
  });
});

describe('meetsTarget', () => {
  it('is true exactly at the target', () => {
    expect(meetsTarget(c(3, 4), 75)).toBe(true);
    expect(meetsTarget(c(75, 100), 75)).toBe(true);
  });
  it('is false just below the target', () => {
    expect(meetsTarget(c(74, 100), 75)).toBe(false);
    expect(meetsTarget(c(23, 31), 75)).toBe(false);
  });
  it('is true with no data (nothing to fail)', () => {
    expect(meetsTarget(c(0, 0), 75)).toBe(true);
  });
  it('validates the target', () => {
    expect(() => meetsTarget(c(1, 1), 0)).toThrow(RangeError);
    expect(() => meetsTarget(c(1, 1), 75.5)).toThrow(RangeError);
  });
});

describe('canBunk', () => {
  it('matches the verified demo: 23/29 at 75% can skip exactly 1', () => {
    expect(canBunk(c(23, 29), 75)).toBe(1);
    // verify by hand
    expect(meetsTarget(c(23, 30), 75)).toBe(true); // skip 1 -> 76.67%
    expect(meetsTarget(c(23, 31), 75)).toBe(false); // skip 2 -> 74.19%
  });

  it('is 0 when already below target', () => {
    expect(canBunk(c(20, 29), 75)).toBe(0);
  });

  it('is 0 when exactly at target with no slack', () => {
    expect(canBunk(c(3, 4), 75)).toBe(0);
  });

  it('is 0 with no data', () => {
    expect(canBunk(c(0, 0), 75)).toBe(0);
  });

  it('target 100: can never skip', () => {
    expect(canBunk(c(10, 10), 100)).toBe(0);
    expect(canBunk(c(9, 10), 100)).toBe(0);
  });

  it('handles perfect attendance at 75%', () => {
    // 10/10: skip x -> 10/(10+x) >= .75 -> x <= 3.33 -> 3
    expect(canBunk(c(10, 10), 75)).toBe(3);
  });

  it('is consistent with meetsTarget for every combination (brute force)', () => {
    for (const target of [1, 33, 50, 60, 75, 80, 85, 90, 99, 100]) {
      for (let total = 0; total <= 40; total++) {
        for (let present = 0; present <= total; present++) {
          const counts = c(present, total);
          const x = canBunk(counts, target);
          if (total === 0) {
            expect(x).toBe(0);
            continue;
          }
          if (!meetsTarget(counts, target)) {
            expect(x).toBe(0);
            continue;
          }
          // skipping x keeps us at/above target, skipping x+1 drops below
          expect(meetsTarget(c(present, total + x), target)).toBe(true);
          expect(meetsTarget(c(present, total + x + 1), target)).toBe(false);
        }
      }
    }
  });
});

describe('mustAttend', () => {
  it('is 0 when already at or above target', () => {
    expect(mustAttend(c(23, 29), 75)).toBe(0);
    expect(mustAttend(c(3, 4), 75)).toBe(0);
    expect(mustAttend(c(0, 0), 75)).toBe(0);
  });

  it('computes the exact number needed', () => {
    // 20/29 at 75%: need y with (20+y)/(29+y) >= .75 -> y >= 7
    expect(mustAttend(c(20, 29), 75)).toBe(7);
    expect(meetsTarget(c(27, 36), 75)).toBe(true);
    expect(meetsTarget(c(26, 35), 75)).toBe(false);
  });

  it('returns null when target is 100 and an absence exists', () => {
    expect(mustAttend(c(9, 10), 100)).toBeNull();
    expect(mustAttend(c(10, 10), 100)).toBe(0);
  });

  it('is the true minimum for every combination (brute force)', () => {
    for (const target of [1, 33, 50, 60, 75, 80, 85, 90, 99]) {
      for (let total = 0; total <= 40; total++) {
        for (let present = 0; present <= total; present++) {
          const y = mustAttend(c(present, total), target);
          expect(y).not.toBeNull();
          const need = y as number;
          expect(meetsTarget(c(present + need, total + need), target)).toBe(true);
          if (need > 0) {
            expect(meetsTarget(c(present + need - 1, total + need - 1), target)).toBe(false);
          }
        }
      }
    }
  });
});

describe('riskLevel', () => {
  it('classifies correctly', () => {
    expect(riskLevel(c(0, 0), 75)).toBe('no-data');
    expect(riskLevel(c(20, 29), 75)).toBe('danger');
    expect(riskLevel(c(3, 4), 75)).toBe('warning');
    expect(riskLevel(c(23, 29), 75)).toBe('safe');
  });
});

describe('simulate', () => {
  it('reproduces the corrected demo', () => {
    const base = c(23, 29);
    const attend = simulate(base, { attend: 1 }, 75);
    expect(attend.counts).toEqual(c(24, 30));
    expect(attend.percentage).toBe(80);
    expect(attend.meetsTarget).toBe(true);

    const skipOne = simulate(base, { skip: 1 }, 75);
    expect(skipOne.counts).toEqual(c(23, 30));
    expect(skipOne.percentage).toBeCloseTo(76.667, 2);
    expect(skipOne.meetsTarget).toBe(true);

    const skipTwo = simulate(base, { skip: 2 }, 75);
    expect(skipTwo.counts).toEqual(c(23, 31));
    expect(skipTwo.percentage).toBeCloseTo(74.194, 2);
    expect(skipTwo.meetsTarget).toBe(false);
  });

  it('supports mixed scenarios and does not mutate input', () => {
    const base = c(23, 29);
    const result = simulate(base, { attend: 2, skip: 1 }, 75);
    expect(result.counts).toEqual(c(25, 32));
    expect(base).toEqual(c(23, 29));
  });

  it('an empty scenario returns the current state', () => {
    expect(simulate(c(23, 29), {}, 75).counts).toEqual(c(23, 29));
  });

  it('rejects negative or fractional inputs', () => {
    expect(() => simulate(c(1, 1), { skip: -1 }, 75)).toThrow(RangeError);
    expect(() => simulate(c(1, 1), { attend: 0.5 }, 75)).toThrow(RangeError);
  });
});

describe('semesterProjection', () => {
  it('computes minimum attendance and maximum skips', () => {
    // 23/29, 10 classes left, final total 39 -> need ceil(0.75*39 - 23) = 7
    const p = semesterProjection(c(23, 29), 75, 10);
    expect(p.reachable).toBe(true);
    expect(p.minAttend).toBe(7);
    expect(p.maxSkip).toBe(3);
    expect(p.maxAchievablePercentage).toBeCloseTo((33 / 39) * 100, 6);
    // sanity: attending 7 works, 6 doesn't
    expect(meetsTarget(c(30, 39), 75)).toBe(true);
    expect(meetsTarget(c(29, 39), 75)).toBe(false);
  });

  it('reports unreachable targets', () => {
    const p = semesterProjection(c(10, 20), 90, 2);
    expect(p.reachable).toBe(false);
    expect(p.minAttend).toBeNull();
    expect(p.maxSkip).toBe(0);
  });

  it('allows skipping everything when comfortably above target', () => {
    const p = semesterProjection(c(100, 100), 50, 10);
    expect(p.reachable).toBe(true);
    expect(p.minAttend).toBe(0);
    expect(p.maxSkip).toBe(10);
  });

  it('handles zero remaining classes', () => {
    const above = semesterProjection(c(23, 29), 75, 0);
    expect(above.reachable).toBe(true);
    expect(above.minAttend).toBe(0);
    expect(above.maxSkip).toBe(0);

    const below = semesterProjection(c(20, 29), 75, 0);
    expect(below.reachable).toBe(false);
  });

  it('handles no data and nothing remaining', () => {
    const p = semesterProjection(c(0, 0), 75, 0);
    expect(p.maxAchievablePercentage).toBeNull();
    expect(p.reachable).toBe(true);
    expect(p.minAttend).toBe(0);
  });

  it('minAttend is the true minimum (brute force)', () => {
    for (const target of [50, 75, 85]) {
      for (let total = 0; total <= 25; total++) {
        for (let present = 0; present <= total; present++) {
          for (let remaining = 0; remaining <= 12; remaining++) {
            const p = semesterProjection(c(present, total), target, remaining);
            let best: number | null = null;
            for (let y = 0; y <= remaining; y++) {
              if (meetsTarget(c(present + y, total + remaining), target)) {
                best = y;
                break;
              }
            }
            expect(p.minAttend).toBe(best);
            expect(p.reachable).toBe(best !== null);
            expect(p.maxSkip).toBe(best === null ? 0 : remaining - best);
          }
        }
      }
    }
  });
});

describe('statusMessage', () => {
  it('covers every state with correct plurals', () => {
    expect(statusMessage(c(0, 0), 75)).toBe('Mark your first class to see your numbers.');
    expect(statusMessage(c(3, 4), 75)).toBe("On the edge — don't skip the next class.");
    expect(statusMessage(c(23, 29), 75)).toBe('You can skip 1 more class.');
    expect(statusMessage(c(10, 10), 75)).toBe('You can skip 3 more classes.');
    expect(statusMessage(c(20, 29), 75)).toBe('Attend the next 7 classes to reach 75%.');
    expect(statusMessage(c(14, 19), 75)).toBe('Attend the next 1 class to reach 75%.');
  });
  it('handles an unreachable 100% target', () => {
    expect(statusMessage(c(9, 10), 100)).toBe("100% can't be reached anymore.");
  });
  it('message is always consistent with the numbers (brute force)', () => {
    for (let total = 1; total <= 30; total++) {
      for (let present = 0; present <= total; present++) {
        const msg = statusMessage(c(present, total), 75);
        expect(msg).not.toMatch(/NaN|undefined|null/);
        if (meetsTarget(c(present, total), 75) && canBunk(c(present, total), 75) >= 1) {
          expect(msg).toMatch(/^You can skip/);
        }
      }
    }
  });
});
