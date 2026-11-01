const express = require('express');
const { body } = require('express-validator');
const {
  listProblems,
  createProblem,
  getProblem,
  updateProblem,
  deleteProblem,
  updateProblemStatus,
} = require('../controllers/problemController');
const {
  createProblemRules,
  updateProblemRules,
  idParamRule,
  listProblemsRules,
} = require('../middleware/rules');
const { STATUSES } = require('../utils/constants');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All problem routes require authentication.
router.use(protect);

/**
 * @route GET    /api/problems
 * @route POST   /api/problems
 */
router.get('/', listProblemsRules, validate, listProblems);
router.post('/', createProblemRules, validate, createProblem);

/**
 * @route GET    /api/problems/:id
 * @route PATCH  /api/problems/:id
 * @route DELETE /api/problems/:id
 */
router.get('/:id', idParamRule, validate, getProblem);
router.patch('/:id', updateProblemRules, validate, updateProblem);
router.delete('/:id', idParamRule, validate, deleteProblem);

/**
 * @route PATCH /api/problems/:id/status
 * @desc  Mark solved / attempted / unsolved
 */
router.patch(
  '/:id/status',
  idParamRule,
  body('status').isIn(STATUSES).withMessage('Status must be Solved, Attempted or Unsolved'),
  validate,
  updateProblemStatus
);

module.exports = router;
