const express = require('express');
const { register, login, me } = require('../controllers/authController');
const { registerRules, loginRules } = require('../middleware/rules');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc  Create an account and return a JWT
 */
router.post('/register', registerRules, validate, register);

/**
 * @route POST /api/auth/login
 * @desc  Authenticate and return a JWT
 */
router.post('/login', loginRules, validate, login);

/**
 * @route GET /api/auth/me
 * @desc  Current authenticated user
 */
router.get('/me', protect, me);

module.exports = router;
