const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(userId) {
  return jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function userPayload(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    dailyGoal: user.dailyGoal,
    codingProfiles: user.codingProfiles || { leetcode: '', geeksforgeeks: '' },
    createdAt: user.createdAt,
  };
}

/**
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  const user = await User.create({ name, email, password });
  const token = signToken(user._id);

  return sendSuccess(res, { token, user: userPayload(user) }, 201);
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const matches = await user.comparePassword(password);
  if (!matches) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const token = signToken(user._id);
  return sendSuccess(res, { token, user: userPayload(user) });
});

/**
 * GET /api/auth/me
 */
const me = asyncHandler(async (req, res) => sendSuccess(res, { user: userPayload(req.user) }));

module.exports = { register, login, me, userPayload, signToken };
