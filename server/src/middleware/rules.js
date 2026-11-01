const { body, param, query } = require('express-validator');
const {
  TOPICS,
  DIFFICULTIES,
  STATUSES,
  PLATFORMS,
  PROGRAMMING_LANGUAGES,
} = require('../utils/constants');

const toLower = (value) => (typeof value === 'string' ? value.toLowerCase() : value);

const toNumber = (value) => {
  if (value === '' || value === null || value === undefined) return value;
  const n = Number(value);
  return Number.isNaN(n) ? value : n;
};

const toDate = (value) => {
  if (value === '' || value === null || value === undefined) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d;
};

/* ------------------------------- Auth ------------------------------- */

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').trim().notEmpty().withMessage('Password is required')
    .isLength({ min: 8, max: 72 }).withMessage('Password must be at least 8 characters'),
];

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').trim().notEmpty().withMessage('Password is required'),
];

/* ------------------------------ Problems ----------------------------- */

const createProblemRules = [
  body('title').trim().notEmpty().withMessage('Question title is required')
    .isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('topic').trim().notEmpty().withMessage('Topic is required')
    .isIn(TOPICS).withMessage('Topic is not a supported DSA topic'),
  body('platform').optional()
    .isIn(PLATFORMS).withMessage('Platform must be LeetCode, GeeksforGeeks, CodeStudio or Other'),
  body('difficulty').optional()
    .isIn(DIFFICULTIES).withMessage('Difficulty must be Easy, Medium or Hard'),
  body('status').optional()
    .isIn(STATUSES).withMessage('Status must be Solved, Attempted or Unsolved'),
  body('programmingLanguage').optional()
    .isIn(PROGRAMMING_LANGUAGES).withMessage('Unsupported programming language'),
  body('problemUrl').optional({ nullable: true }).trim()
    .custom((v) => !v || /^https?:\/\/\S+$/i.test(v))
    .withMessage('Problem URL must be a valid http(s) URL'),
  body('timeComplexity').optional({ nullable: true }).trim().isLength({ max: 60 }).withMessage('Time complexity too long'),
  body('spaceComplexity').optional({ nullable: true }).trim().isLength({ max: 60 }).withMessage('Space complexity too long'),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 5000 }).withMessage('Notes cannot exceed 5000 characters'),
];

const updateProblemRules = [
  param('id').isMongoId().withMessage('Invalid problem id'),
  body('title').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('topic').optional().isIn(TOPICS).withMessage('Topic is not a supported DSA topic'),
  body('platform').optional().isIn(PLATFORMS).withMessage('Invalid platform'),
  body('difficulty').optional().isIn(DIFFICULTIES).withMessage('Invalid difficulty'),
  body('status').optional().isIn(STATUSES).withMessage('Invalid status'),
  body('programmingLanguage').optional().isIn(PROGRAMMING_LANGUAGES).withMessage('Unsupported programming language'),
  body('problemUrl').optional({ nullable: true }).trim()
    .custom((v) => !v || /^https?:\/\/\S+$/i.test(v))
    .withMessage('Problem URL must be a valid http(s) URL'),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 5000 }).withMessage('Notes cannot exceed 5000 characters'),
];

const idParamRule = [param('id').isMongoId().withMessage('Invalid id')];

const listProblemsRules = [
  query('page').optional().custom(toNumber).isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().custom(toNumber).isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
  query('topic').optional().isIn(TOPICS).withMessage('Invalid topic filter'),
  query('difficulty').optional().isIn(DIFFICULTIES).withMessage('Invalid difficulty filter'),
  query('status').optional().isIn(STATUSES).withMessage('Invalid status filter'),
  query('platform').optional().isIn(PLATFORMS).withMessage('Invalid platform filter'),
  query('search').optional().isLength({ max: 200 }).withMessage('Search term too long'),
];

/* ----------------------------- Revisions ----------------------------- */

const createRevisionRules = [
  body('problemId').isMongoId().withMessage('Invalid problem id'),
  body('revisionDate').custom(toDate).isISO8601().withMessage('revisionDate must be a valid date')
    .toDate(),
];

const updateRevisionRules = [
  param('id').isMongoId().withMessage('Invalid revision id'),
  body('completed').optional().isBoolean().withMessage('completed must be a boolean'),
  body('revisionDate').optional().custom(toDate).isISO8601().withMessage('revisionDate must be a valid date').toDate(),
];

/* -------------------------------- Goals ------------------------------ */

const createGoalRules = [
  body('dailyTarget').custom(toNumber).isInt({ min: 1, max: 50 }).withMessage('dailyTarget must be 1-50'),
  body('weeklyTarget').custom(toNumber).isInt({ min: 1, max: 350 }).withMessage('weeklyTarget must be 1-350'),
  body('startDate').optional().custom(toDate).isISO8601().withMessage('startDate must be a valid date').toDate(),
  body('endDate').optional().custom(toDate).isISO8601().withMessage('endDate must be a valid date').toDate(),
];

const updateGoalRules = [
  param('id').isMongoId().withMessage('Invalid goal id'),
  body('dailyTarget').optional().custom(toNumber).isInt({ min: 1, max: 50 }).withMessage('dailyTarget must be 1-50'),
  body('weeklyTarget').optional().custom(toNumber).isInt({ min: 1, max: 350 }).withMessage('weeklyTarget must be 1-350'),
  body('startDate').optional().custom(toDate).isISO8601().withMessage('startDate must be a valid date').toDate(),
  body('endDate').optional().custom(toDate).isISO8601().withMessage('endDate must be a valid date').toDate(),
];

/* ------------------------------ Profile ------------------------------ */

const updateProfileRules = [
  body('name').optional().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('dailyGoal').optional().custom(toNumber).isInt({ min: 1, max: 50 }).withMessage('Daily goal must be 1-50'),
  body('codingProfiles.leetcode').optional({ nullable: true }).trim()
    .custom((v) => !v || /^https?:\/\/\S+$/i.test(v))
    .withMessage('LeetCode profile must be a valid URL'),
  body('codingProfiles.geeksforgeeks').optional({ nullable: true }).trim()
    .custom((v) => !v || /^https?:\/\/\S+$/i.test(v))
    .withMessage('GeeksforGeeks profile must be a valid URL'),
  body('currentPassword').optional({ nullable: true }).isLength({ min: 8, max: 72 }).withMessage('Current password must be at least 8 characters'),
  body('newPassword').optional({ nullable: true }).isLength({ min: 8, max: 72 }).withMessage('New password must be at least 8 characters'),
];

module.exports = {
  registerRules,
  loginRules,
  createProblemRules,
  updateProblemRules,
  idParamRule,
  listProblemsRules,
  createRevisionRules,
  updateRevisionRules,
  createGoalRules,
  updateGoalRules,
  updateProfileRules,
  toLower,
  toNumber,
  toDate,
};
