const Goal = require('../models/Goal');
const Problem = require('../models/Problem');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { countByDay, dayKey, startOfUTCDay, keyToUTCDate, DAY_MS } = require('../utils/dates');

const pct = (part, whole) => (whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : 0);

/** UTC start of the current calendar week (Monday). */
function startOfCurrentWeek(now = new Date()) {
  const day = startOfUTCDay(now).getTime();
  const weekday = new Date(day).getUTCDay(); // 0 = Sunday
  const daysSinceMonday = (weekday + 6) % 7;
  return new Date(day - daysSinceMonday * DAY_MS);
}

/**
 * Resolves daily/weekly targets with sensible fallbacks:
 * active Goal document first, then the user's dailyGoal preference.
 */
function resolveTargets(goal, user) {
  return {
    daily: goal ? goal.dailyTarget : user.dailyGoal,
    weekly: goal ? goal.weeklyTarget : null,
  };
}

async function buildProgress(userId, goal, user) {
  const since = goal ? startOfUTCDay(keyToUTCDate(dayKey(goal.startDate))) : startOfUTCDay();

  const docs = await Problem.find({
    userId,
    status: 'Solved',
    solvedAt: { $gte: since },
  })
    .select('solvedAt')
    .lean();

  const counts = countByDay(docs.map((d) => d.solvedAt));
  const solvedToday = counts[dayKey(new Date())] || 0;

  const weekStart = startOfCurrentWeek();
  let solvedThisWeek = 0;
  Object.entries(counts).forEach(([key, value]) => {
    if (keyToUTCDate(key).getTime() >= weekStart.getTime()) solvedThisWeek += value;
  });

  const targets = resolveTargets(goal, user);

  return {
    daily: {
      target: targets.daily,
      solved: solvedToday,
      percentage: pct(solvedToday, targets.daily),
      completed: solvedToday >= targets.daily,
    },
    weekly: {
      target: targets.weekly,
      solved: solvedThisWeek,
      percentage: pct(solvedThisWeek, targets.weekly),
      completed: targets.weekly ? solvedThisWeek >= targets.weekly : false,
      weekStart: weekStart.toISOString(),
    },
  };
}

/**
 * GET /api/goals
 * Returns the active goal (if any) plus real progress computed from
 * question solving dates.
 */
const getGoals = asyncHandler(async (req, res) => {
  const [goal, progress] = await Promise.all([
    Goal.findOne({ userId: req.user._id, active: true }).sort({ endDate: -1 }),
    buildProgress(req.user._id, null, req.user),
  ]);

  // Recompute progress with the goal's targets once we know the goal exists.
  const finalProgress = goal
    ? await buildProgress(req.user._id, goal, req.user)
    : progress;

  return sendSuccess(res, { goal, progress: finalProgress });
});

/**
 * POST /api/goals  { dailyTarget, weeklyTarget, startDate?, endDate? }
 * Creates a new active goal and deactivates any previous one.
 */
const createGoal = asyncHandler(async (req, res) => {
  const { dailyTarget, weeklyTarget, startDate, endDate } = req.body;

  const start = startDate ? new Date(startDate) : startOfUTCDay();
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 6 * DAY_MS);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw ApiError.badRequest('startDate and endDate must be valid dates.');
  }
  if (end < start) throw ApiError.badRequest('endDate must be on or after startDate.');

  await Goal.updateMany({ userId: req.user._id, active: true }, { $set: { active: false } });

  const goal = await Goal.create({
    userId: req.user._id,
    dailyTarget,
    weeklyTarget,
    startDate: start,
    endDate: end,
    active: true,
  });

  const progress = await buildProgress(req.user._id, goal, req.user);
  return sendSuccess(res, { goal, progress }, 201);
});

/**
 * PATCH /api/goals/:id  { dailyTarget?, weeklyTarget?, startDate?, endDate? }
 */
const updateGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
  if (!goal) throw ApiError.notFound('Goal not found.');

  ['dailyTarget', 'weeklyTarget'].forEach((field) => {
    if (req.body[field] !== undefined) goal[field] = req.body[field];
  });
  if (req.body.startDate !== undefined) goal.startDate = new Date(req.body.startDate);
  if (req.body.endDate !== undefined) goal.endDate = new Date(req.body.endDate);

  await goal.save();

  const progress = await buildProgress(goal.userId, goal, req.user);
  return sendSuccess(res, { goal, progress });
});

module.exports = { getGoals, createGoal, updateGoal, startOfCurrentWeek };
