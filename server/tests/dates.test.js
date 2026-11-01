/**
 * Unit tests for the streak/date helpers — the foundation of every
 * streak and activity number the dashboard displays.
 */
const {
  computeStreaks,
  countByDay,
  buildActivitySeries,
  lastNDayKeys,
  dayKey,
} = require('../src/utils/dates');

// Fixed reference "now": Wednesday 2026-01-07 UTC.
const NOW = new Date('2026-01-07T12:00:00.000Z');

describe('computeStreaks', () => {
  it('returns 0/0 for no activity', () => {
    expect(computeStreaks([], NOW)).toEqual({ currentStreak: 0, longestStreak: 0 });
    expect(computeStreaks(null, NOW)).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it('counts a streak ending today', () => {
    const keys = ['2026-01-05', '2026-01-06', '2026-01-07'];
    expect(computeStreaks(keys, NOW)).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it('keeps the streak alive when today is not solved yet (yesterday was)', () => {
    const keys = ['2026-01-05', '2026-01-06'];
    expect(computeStreaks(keys, NOW).currentStreak).toBe(2);
  });

  it('breaks the current streak when the gap includes yesterday', () => {
    const keys = ['2026-01-04', '2026-01-05']; // today = 07th, gap at 06th
    expect(computeStreaks(keys, NOW).currentStreak).toBe(0);
    expect(computeStreaks(keys, NOW).longestStreak).toBe(2);
  });

  it('reports the longest run even when it is in the past', () => {
    const keys = [
      '2025-12-01', '2025-12-02', '2025-12-03', '2025-12-04', // 4-day run
      '2026-01-07', // single day today
    ];
    const result = computeStreaks(keys, NOW);
    expect(result.longestStreak).toBe(4);
    expect(result.currentStreak).toBe(1);
  });

  it('ignores duplicate day keys', () => {
    const keys = ['2026-01-07', '2026-01-07', '2026-01-06'];
    expect(computeStreaks(keys, NOW).currentStreak).toBe(2);
  });

  it('handles month boundaries', () => {
    const keys = ['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05', '2026-01-06', '2026-01-07'];
    const result = computeStreaks(keys, NOW);
    expect(result.currentStreak).toBe(9);
    expect(result.longestStreak).toBe(9);
  });
});

describe('countByDay', () => {
  it('buckets dates by UTC day', () => {
    const dates = [
      new Date('2026-01-07T01:00:00Z'),
      new Date('2026-01-07T23:59:00Z'),
      new Date('2026-01-06T10:00:00Z'),
    ];
    expect(countByDay(dates)).toEqual({ '2026-01-07': 2, '2026-01-06': 1 });
  });

  it('ignores null/undefined values', () => {
    expect(countByDay([null, undefined, new Date('2026-01-07T10:00:00Z')])).toEqual({
      '2026-01-07': 1,
    });
  });
});

describe('buildActivitySeries', () => {
  it('zero-fills days without activity', () => {
    const keys = lastNDayKeys(3, NOW);
    const series = buildActivitySeries(keys, { [dayKey(NOW)]: 5 });

    expect(series).toHaveLength(3);
    expect(series[0].count).toBe(0);
    expect(series[2].count).toBe(5);
    expect(series[2].date).toBe('2026-01-07');
  });
});
