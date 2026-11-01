/**
 * Development-only demo data seeder.
 *
 * Usage:  npm run seed:demo
 *
 * Creates ONE clearly-marked demo account with realistic, randomized DSA
 * data spread across the last 60 days so every dashboard chart has content.
 * Demo data lives only under the demo account (email demo@codetrack.dev) and
 * is never mixed with other users' records. Safe to re-run: it wipes the
 * demo account first.
 */
require('dotenv').config();

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Problem = require('../src/models/Problem');
const Revision = require('../src/models/Revision');
const Goal = require('../src/models/Goal');
const { TOPICS } = require('../src/utils/constants');

const DEMO_EMAIL = 'demo@codetrack.dev';
const DAY = 86400000;

const TITLE_POOL = {
  Arrays: ['Two Sum', 'Best Time to Buy and Sell Stock', 'Merge Intervals', 'Product of Array Except Self', 'Rotate Array', 'Trapping Rain Water'],
  Strings: ['Valid Anagram', 'Longest Common Prefix', 'Group Anagrams', 'Longest Palindromic Substring', 'Minimum Window Substring'],
  'Linked Lists': ['Reverse Linked List', 'Detect Cycle in Linked List', 'Merge Two Sorted Lists', 'LRU Cache'],
  Stack: ['Valid Parentheses', 'Min Stack', 'Daily Temperatures', 'Largest Rectangle in Histogram'],
  Queue: ['Implement Queue using Stacks', 'Sliding Window Maximum', 'Rotting Oranges'],
  'Binary Search': ['Search in Rotated Sorted Array', 'Find Peak Element', 'Koko Eating Bananas', 'Median of Two Sorted Arrays'],
  Trees: ['Maximum Depth of Binary Tree', 'Invert Binary Tree', 'Level Order Traversal', 'Validate Binary Search Tree', 'Diameter of Binary Tree'],
  'Binary Search Trees': ['Kth Smallest Element in a BST', 'Lowest Common Ancestor', 'Convert Sorted Array to BST'],
  Graphs: ['Number of Islands', 'Course Schedule', 'Word Ladder', 'Dijkstra Shortest Path', 'Clone Graph'],
  'Dynamic Programming': ['Climbing Stairs', 'Longest Increasing Subsequence', 'Coin Change', '0/1 Knapsack', 'Edit Distance', 'House Robber'],
  'Greedy Algorithms': ['Jump Game', 'Gas Station', 'N Meetings in a Room', 'Activity Selection'],
  Recursion: ['Power Set', 'Subset Sum', 'Tower of Hanoi'],
  Backtracking: ['N-Queens', 'Sudoku Solver', 'Permutations', 'Combination Sum'],
  'Sliding Window': ['Longest Substring Without Repeating Characters', 'Fruits Into Baskets', 'Count Occurrences in Anagram'],
  'Two Pointers': ['Container With Most Water', 'Trapping Rain Water II', 'Sort Colors'],
  Heaps: ['Kth Largest Element in an Array', 'Merge K Sorted Lists', 'Top K Frequent Elements'],
  Tries: ['Implement Trie', 'Word Search II', 'Longest Common Prefix via Trie'],
  'Bit Manipulation': ['Single Number', 'Count Set Bits', 'Power of Two', 'XOR of Range'],
};

const PLATFORMS = ['LeetCode', 'LeetCode', 'LeetCode', 'GeeksforGeeks', 'CodeStudio'];
const LANGUAGES = ['C++', 'Java', 'Python', 'JavaScript'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeightedDifficulty() {
  const roll = Math.random();
  if (roll < 0.45) return 'Easy';
  if (roll < 0.8) return 'Medium';
  return 'Hard';
}

async function seed() {
  await connectDB();

  console.log('[seed] Clearing previous demo account and its data...');
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    await Problem.deleteMany({ userId: existing._id });
    await Revision.deleteMany({ userId: existing._id });
    await Goal.deleteMany({ userId: existing._id });
    await User.deleteOne({ _id: existing._id });
  }

  const user = await User.create({
    name: 'Demo User',
    email: DEMO_EMAIL,
    password: 'demo1234', // hashed by the model
    dailyGoal: 3,
    codingProfiles: {
      leetcode: 'https://leetcode.com/u/demo-user/',
      geeksforgeeks: 'https://www.geeksforgeeks.org/user/demo-user/',
    },
  });

  console.log('[seed] Creating ~70 problems across the last 60 days...');
  const problems = [];
  const now = Date.now();

  for (let i = 0; i < 70; i += 1) {
    const topic = pick(TOPICS);
    const titlePool = TITLE_POOL[topic] || ['Generic Problem'];
    const difficulty = pickWeightedDifficulty();

    const statusRoll = Math.random();
    const status = statusRoll < 0.62 ? 'Solved' : statusRoll < 0.82 ? 'Attempted' : 'Unsolved';

    const createdAt = new Date(now - Math.floor(Math.random() * 60) * DAY);
    const solvedAt =
      status === 'Solved'
        ? new Date(createdAt.getTime() + Math.floor(Math.random() * 2) * DAY)
        : null;

    problems.push({
      userId: user._id,
      title: `${pick(titlePool)} ${i + 1}`,
      platform: pick(PLATFORMS),
      problemUrl: 'https://leetcode.com/problemset/',
      topic,
      difficulty,
      status,
      timeComplexity: pick(['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)']),
      spaceComplexity: pick(['O(1)', 'O(n)', 'O(log n)']),
      notes: status === 'Solved' ? 'Reviewed the optimal approach and noted edge cases.' : '',
      programmingLanguage: pick(LANGUAGES),
      createdAt,
      solvedAt,
      updatedAt: solvedAt || createdAt,
    });
  }

  const inserted = await Problem.insertMany(problems);

  console.log('[seed] Creating upcoming + overdue revisions...');
  const solvedProblems = inserted.filter((p) => p.status === 'Solved');
  const revisions = [];
  for (let i = 0; i < Math.min(8, solvedProblems.length); i += 1) {
    const offsetDays = i < 5 ? i + 1 : -(i - 3); // first 5 upcoming, rest overdue
    revisions.push({
      userId: user._id,
      problemId: solvedProblems[i]._id,
      revisionDate: new Date(now + offsetDays * DAY),
      completed: false,
      completedAt: null,
    });
  }
  // A couple of completed history entries.
  for (let i = 8; i < Math.min(11, solvedProblems.length); i += 1) {
    revisions.push({
      userId: user._id,
      problemId: solvedProblems[i]._id,
      revisionDate: new Date(now - (i - 7) * DAY),
      completed: true,
      completedAt: new Date(now - (i - 8) * DAY),
    });
  }
  await Revision.insertMany(revisions);

  console.log('[seed] Creating an active weekly goal...');
  await Goal.create({
    userId: user._id,
    dailyTarget: 3,
    weeklyTarget: 15,
    startDate: new Date(now - 2 * DAY),
    endDate: new Date(now + 5 * DAY),
    active: true,
  });

  console.log('');
  console.log('[seed] Demo data ready.');
  console.log('[seed]   email:    ', DEMO_EMAIL);
  console.log('[seed]   password:  demo1234');
  console.log('[seed]   problems: ', problems.length);
  console.log('[seed]   revisions:', revisions.length);
  console.log('');
  console.log('[seed] Log in with these credentials to explore a populated dashboard.');
  console.log('[seed] Delete this account (or drop its records) before using real user data.');

  await disconnectDB();
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
