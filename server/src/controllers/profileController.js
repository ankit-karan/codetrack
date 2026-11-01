const User = require('../models/User');
const Problem = require('../models/Problem');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { userPayload } = require('./authController');

/**
 * GET /api/profile
 * Returns the profile plus lightweight account stats (all real records).
 */
const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [total, solved] = await Promise.all([
    Problem.countDocuments({ userId }),
    Problem.countDocuments({ userId, status: 'Solved' }),
  ]);

  return sendSuccess(res, {
    user: userPayload(req.user),
    stats: { totalQuestions: total, solvedQuestions: solved },
  });
});

/**
 * PATCH /api/profile
 * Updates name, dailyGoal, coding profile URLs — or changes the password
 * when both currentPassword and newPassword are provided.
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const body = req.body;

  // --- Password change flow ---
  const wantsPasswordChange = Boolean(body.currentPassword || body.newPassword);
  if (wantsPasswordChange) {
    if (!body.currentPassword || !body.newPassword) {
      throw ApiError.badRequest('Both currentPassword and newPassword are required to change the password.');
    }

    // Password field is select:false — load it explicitly for comparison.
    const withPassword = await User.findById(user._id).select('+password');
    const matches = await withPassword.comparePassword(body.currentPassword);
    if (!matches) {
      throw ApiError.badRequest('Current password is incorrect.');
    }

    withPassword.password = body.newPassword;
    await withPassword.save();
  }

  // --- Simple profile fields ---
  if (body.name !== undefined) user.name = body.name;
  if (body.dailyGoal !== undefined) user.dailyGoal = body.dailyGoal;
  if (body.codingProfiles !== undefined) {
    user.codingProfiles = {
      leetcode: body.codingProfiles.leetcode || '',
      geeksforgeeks: body.codingProfiles.geeksforgeeks || '',
    };
  }

  await user.save();

  return sendSuccess(res, {
    user: userPayload(user),
    passwordChanged: wantsPasswordChange,
  });
});

module.exports = { getProfile, updateProfile };
