/**
 * Formatting helpers used across pages and components.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** 'YYYY-MM-DD' key for a date in the browser's local timezone. */
export function toDateKey(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 'Jan 5, 2026' style date. */
export function formatDate(input) {
  if (!input) return '—';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** 'Jan 5, 2026 · 4:12 PM' style. */
export function formatDateTime(input) {
  if (!input) return '—';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${formatDate(d)} · ${hour12}:${minutes} ${ampm}`;
}

/** Weekday short label from a date key or date. */
export function formatWeekday(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  return WEEKDAYS[d.getDay()];
}

/** 'MMM D' from a 'YYYY-MM-DD' key (avoids timezone shifts). */
export function shortDateFromKey(key) {
  if (!key || key.length < 10) return key || '';
  const [, month, day] = key.split('-');
  const monthIndex = Number(month) - 1;
  return `${MONTHS[monthIndex] || month} ${Number(day)}`;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** Percentage rounded to whole numbers; 0-safe. */
export function percentage(part, whole) {
  if (!whole || whole <= 0) return 0;
  return clamp(Math.round((part / whole) * 100), 0, 100);
}

/** Days between a date and today, rounded (positive = past). */
export function daysFromToday(input) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((today - target) / 86400000);
}

/** Extract a readable message from an axios error. */
export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (data?.errors?.length) return data.errors[0].message;
  if (data?.message) return data.message;
  if (error?.message === 'Network Error') return 'Cannot reach the server. Is the backend running?';
  return error?.message || fallback;
}
