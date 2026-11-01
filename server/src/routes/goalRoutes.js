const express = require('express');
const { getGoals, createGoal, updateGoal } = require('../controllers/goalController');
const { createGoalRules, updateGoalRules, idParamRule } = require('../middleware/rules');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

/**
 * @route GET    /api/goals
 * @route POST   /api/goals
 * @route PATCH  /api/goals/:id
 */
router.get('/', getGoals);
router.post('/', createGoalRules, validate, createGoal);
router.patch('/:id', updateGoalRules, validate, updateGoal);

module.exports = router;
