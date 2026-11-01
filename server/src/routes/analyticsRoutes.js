const express = require('express');
const { overview, topics, difficulty, activity } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Every analytics route is scoped to the authenticated user.
router.use(protect);

/**
 * @route GET /api/analytics/overview
 * @route GET /api/analytics/topics
 * @route GET /api/analytics/difficulty
 * @route GET /api/analytics/activity?days=7|30|90|365
 */
router.get('/overview', overview);
router.get('/topics', topics);
router.get('/difficulty', difficulty);
router.get('/activity', activity);

module.exports = router;
