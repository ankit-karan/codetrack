import { describe, it, expect } from 'vitest';
import {
  formatDate,
  percentage,
  daysFromToday,
  getApiErrorMessage,
  toDateKey,
  shortDateFromKey,
} from '../utils/formatters';

describe('formatDate', () => {
  it('formats a valid date', () => {
    expect(formatDate('2026-01-05T10:00:00Z')).toBe('Jan 5, 2026');
  });

  it('returns an em dash for missing/invalid input', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('')).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
  });
});

describe('percentage', () => {
  it('computes whole percentages', () => {
    expect(percentage(3, 5)).toBe(60);
    expect(percentage(2, 3)).toBe(67);
  });

  it('is zero-safe', () => {
    expect(percentage(0, 0)).toBe(0);
    expect(percentage(5, 0)).toBe(0);
  });

  it('clamps between 0 and 100', () => {
    expect(percentage(12, 5)).toBe(100);
    expect(percentage(-1, 5)).toBe(0);
  });
});

describe('daysFromToday', () => {
  it('returns positive numbers for past dates', () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    expect(daysFromToday(past)).toBe(3);
  });

  it('returns 0 for today', () => {
    expect(daysFromToday(new Date())).toBe(0);
  });

  it('returns 0 for invalid dates', () => {
    expect(daysFromToday('nope')).toBe(0);
  });
});

describe('toDateKey / shortDateFromKey', () => {
  it('round-trips a local date key', () => {
    const date = new Date(2026, 0, 5); // Jan 5 2026 local
    expect(toDateKey(date)).toBe('2026-01-05');
    expect(shortDateFromKey('2026-01-05')).toBe('Jan 5');
  });
});

describe('getApiErrorMessage', () => {
  it('prefers the first structured field error', () => {
    const error = {
      response: { data: { message: 'Boom', errors: [{ message: 'Title is required' }] } },
    };
    expect(getApiErrorMessage(error)).toBe('Title is required');
  });

  it('falls back to the response message', () => {
    const error = { response: { data: { message: 'Not found' } } };
    expect(getApiErrorMessage(error)).toBe('Not found');
  });

  it('handles network errors', () => {
    expect(getApiErrorMessage({ message: 'Network Error' })).toContain('Cannot reach the server');
  });

  it('uses the custom fallback when nothing is available', () => {
    expect(getApiErrorMessage({}, 'Custom')).toBe('Custom');
  });
});
