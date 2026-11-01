const express = require('express');
const { getProfile, updateProfile } = require('../controllers/profileController');
const { updateProfileRules } = require('../middleware/rules');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

/**
 * @route GET   /api/profile
 * @route PATCH /api/profile
 */
router.get('/', getProfile);
router.patch('/', updateProfileRules, validate, updateProfile);

module.exports = router;
