/**
 * Date and streak helpers.
 *
 * All day bucketing is done in UTC so the database value is the single source
 * of truth regardless of which server or browser renders it. (Documented in the
 * README as an intentional engineering decision.)
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** 'YYYY-MM-DD' key for a given date (UTC). */
function dayKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}

/** Parse a 'YYYY-MM-DD' key back into a UTC Date at midnight. */
function keyToUTCDate(key) {
  return new Date(`${key}T00:00:00.000Z`);
}

/** UTC date key of "today". */
function todayKey(now = new Date()) {
  return dayKey(now);
}

/** Start of the current UTC day (midnight). */
function startOfUTCDay(now = new Date()) {
  return keyToUTCDate(dayKey(now));
}

/** Inclusive list of 'YYYY-MM-DD' keys from `from` to `to`. */
function dateRangeKeys(from, to) {
  const keys = [];
  const start = keyToUTCDate(dayKey(from)).getTime();
  const end = keyToUTCDate(dayKey(to)).getTime();
  for (let t = start; t <= end; t += DAY_MS) {
    keys.push(dayKey(new Date(t)));
  }
  return keys;
}

/** Last `days` day keys ending today (inclusive). */
function lastNDayKeys(days, now = new Date()) {
  const end = keyToUTCDate(dayKey(now)).getTime();
  const start = end - (days - 1) * DAY_MS;
  return dateRangeKeys(new Date(start), new Date(end));
}

/**
 * Count occurrences per 'YYYY-MM-DD' day key from a list of Date values.
 * Returns a plain object: { '2026-01-01': 3, ... }
 */
function countByDay(dates) {
  const counts = {};
  (dates || []).forEach((value) => {
    if (!value) return;
    const key = dayKey(value);
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

/**
 * Zero-filled daily activity series: [{ date, count }, ...]
 * @param {string[]} keys ordered day keys to materialize
 * @param {Record<string, number>} counts counts per day key
 */
function buildActivitySeries(keys, counts) {
  return keys.map((date) => ({ date, count: counts[date] || 0 }));
}

/**
 * Compute current and longest practice streaks from a set of day keys.
 *
 * - `currentStreak` counts consecutive days ending today. If the user has not
 *   solved anything today yet, yesterday still keeps the streak alive.
 * - Days must be valid 'YYYY-MM-DD' strings; duplicates are ignored.
 *
 * @param {Iterable<string>} dayKeys
 * @param {Date} now reference date (injectable for tests)
 * @returns {{ currentStreak: number, longestStreak: number }}
 */
function computeStreaks(dayKeys, now = new Date()) {
  const unique = new Set();
  (dayKeys || []).forEach((key) => {
    if (key) unique.add(key);
  });

  if (unique.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const sortedAsc = Array.from(unique).sort();

  // ---- Longest streak ----
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedAsc.length; i += 1) {
    const prev = keyToUTCDate(sortedAsc[i - 1]).getTime();
    const curr = keyToUTCDate(sortedAsc[i]).getTime();
    if (curr - prev === DAY_MS) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // ---- Current streak ----
  const today = dayKey(now);
  const yesterday = dayKey(new Date(keyToUTCDate(today).getTime() - DAY_MS));

  let anchor = null;
  if (unique.has(today)) anchor = today;
  else if (unique.has(yesterday)) anchor = yesterday;

  let currentStreak = 0;
  if (anchor) {
    currentStreak = 1;
    let cursor = keyToUTCDate(anchor).getTime() - DAY_MS;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const key = dayKey(new Date(cursor));
      if (unique.has(key)) {
        currentStreak += 1;
        cursor -= DAY_MS;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak: longest };
}

module.exports = {
  DAY_MS,
  dayKey,
  keyToUTCDate,
  todayKey,
  startOfUTCDay,
  dateRangeKeys,
  lastNDayKeys,
  countByDay,
  buildActivitySeries,
  computeStreaks,
};
