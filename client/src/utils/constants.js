/**
 * Shared frontend constants.
 * Kept in sync with server/src/utils/constants.js — the backend validates
 * every value, this file only drives UI options.
 */

export const TOPICS = [
  'Arrays',
  'Strings',
  'Linked Lists',
  'Stack',
  'Queue',
  'Binary Search',
  'Trees',
  'Binary Search Trees',
  'Graphs',
  'Dynamic Programming',
  'Greedy Algorithms',
  'Recursion',
  'Backtracking',
  'Sliding Window',
  'Two Pointers',
  'Heaps',
  'Tries',
  'Bit Manipulation',
];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export const STATUSES = ['Solved', 'Attempted', 'Unsolved'];

export const PLATFORMS = ['LeetCode', 'GeeksforGeeks', 'CodeStudio', 'Other'];

export const PROGRAMMING_LANGUAGES = [
  'C++',
  'Java',
  'Python',
  'JavaScript',
  'TypeScript',
  'Go',
  'Rust',
  'C#',
  'Other',
];

/** Tailwind-friendly color classes per value (used by badges/charts). */
export const DIFFICULTY_STYLES = {
  Easy: { dot: 'bg-easy', text: 'text-easy', soft: 'bg-easy/10 text-easy' },
  Medium: { dot: 'bg-medium', text: 'text-medium', soft: 'bg-medium/10 text-medium' },
  Hard: { dot: 'bg-hard', text: 'text-hard', soft: 'bg-hard/10 text-hard' },
};

export const STATUS_STYLES = {
  Solved: { soft: 'bg-success-soft text-success', dot: 'bg-success' },
  Attempted: { soft: 'bg-warning-soft text-warning', dot: 'bg-warning' },
  Unsolved: { soft: 'bg-danger-soft text-danger', dot: 'bg-danger' },
};

export const PLATFORM_STYLES = {
  LeetCode: 'bg-warning-soft text-warning',
  GeeksforGeeks: 'bg-success-soft text-success',
  CodeStudio: 'bg-info-soft text-info',
  Other: 'bg-brand-soft text-brand-500',
};
