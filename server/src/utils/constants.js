/**
 * Canonical application constants shared across models, validation and analytics.
 * Keeping them in one place guarantees the enums stored in MongoDB always match
 * the values the API accepts and the frontend renders.
 */

const TOPICS = [
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

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const STATUSES = ['Solved', 'Attempted', 'Unsolved'];

const PLATFORMS = ['LeetCode', 'GeeksforGeeks', 'CodeStudio', 'Other'];

const PROGRAMMING_LANGUAGES = [
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

module.exports = {
  TOPICS,
  DIFFICULTIES,
  STATUSES,
  PLATFORMS,
  PROGRAMMING_LANGUAGES,
};
