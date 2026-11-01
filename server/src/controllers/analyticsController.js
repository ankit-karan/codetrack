const Problem = require('../models/Problem');
const Revision = require('../models/Revision');
const Goal = require('../models/Goal');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { TOPICS, DIFFICULTIES, STATUSES } = require('../utils/constants');
const {
  countByDay,
  buildActivitySeries,
  lastNDayKeys,
  computeStreaks,
  startOfUTCDay,
} = require('../utils/dates');

const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

async function fetchSolvedDayKeys(userId) {
  const docs = await Problem.find({
    userId,
    status: 'Solved',
    solvedAt: { $ne: null },
  })
    .select('solvedAt')
    .lean();

  return docs.map((d) => {
    const day = new Date(d.solvedAt).toISOString().slice(0, 10);
    return day;
  });
}

/**
 * GET /api/analytics/overview
 * Totals, difficulty split, completion %, streaks, daily/weekly activity,
 * goal progress and revision counters — all from real records.
 */
const overview = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [statusAgg, difficultyAgg, solvedDayKeys, openRevisions, overdueRevisions, activeGoal] =
    await Promise.all([
      Problem.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Problem.aggregate([
        { $match: { userId } },
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      ]),
      fetchSolvedDayKeys(userId),
      Revision.countDocuments({ userId, completed: false }),
      Revision.countDocuments({ userId, completed: false, revisionDate: { $lt: startOfUTCDay() } }),
      Goal.findOne({ userId, active: true }).sort({ endDate: -1 }).lean(),
    ]);

  const byStatus = { Solved: 0, Attempted: 0, Unsolved: 0 };
  statusAgg.forEach((row) => {
    if (byStatus[row._id] !== undefined) byStatus[row._id] = row.count;
  });

  // Totals must always satisfy: total = solved + attempted + unsolved
  const total = byStatus.Solved + byStatus.Attempted + byStatus.Unsolved;
  const completionPercentage = pct(byStatus.Solved, total);

  const byDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
  difficultyAgg.forEach((row) => {
    if (byDifficulty[row._id] !== undefined) byDifficulty[row._id] = row.count;
  });

  // Difficulty counts must sum to total as well.
  const difficultyTotal = DIFFICULTIES.reduce((sum, d) => sum + byDifficulty[d], 0);

  const dayCounts = countByDay(
    solvedDayKeys.map((k) => new Date(`${k}T00:00:00.000Z`))
  );
  const { currentStreak, longestStreak } = computeStreaks(solvedDayKeys);

  const weekKeys = lastNDayKeys(7);
  const weekSolved = weekKeys.reduce((sum, k) => sum + (dayCounts[k] || 0), 0);
  const todayKeyStr = weekKeys[weekKeys.length - 1];
  const solvedToday = dayCounts[todayKeyStr] || 0;

  const dailyTarget = req.user.dailyGoal;
  const monthlySeries = buildActivitySeries(lastNDayKeys(30), dayCounts);
  const weeklySeries = buildActivitySeries(weekKeys, dayCounts);

  return sendSuccess(res, {
    totals: {
      total,
      solved: byStatus.Solved,
      attempted: byStatus.Attempted,
      unsolved: byStatus.Unsolved,
      easy: byDifficulty.Easy,
      medium: byDifficulty.Medium,
      hard: byDifficulty.Hard,
      difficultyTotal,
    },
    completionPercentage,
    streak: { current: currentStreak, longest: longestStreak },
    activity: {
      solvedToday,
      solvedThisWeek: weekSolved,
      dailyTarget,
      dailyTargetMet: solvedToday >= dailyTarget,
      weeklyTarget: activeGoal ? activeGoal.weeklyTarget : null,
      weeklySeries,
      monthlySeries,
    },
    revisions: {
      pending: openRevisions,
      overdue: overdueRevisions,
    },
  });
});

/**
 * GET /api/analytics/topics
 * Per-topic totals, solved counts, completion %, difficulty split and
 * weak topics (>= 3 questions but < 50% solved).
 */
const topics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const rows = await Problem.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$topic',
        total: { $sum: 1 },
        solved: { $sum: { $cond: [{ $eq: ['$status', 'Solved'] }, 1, 0] } },
        attempted: { $sum: { $cond: [{ $eq: ['$status', 'Attempted'] }, 1, 0] } },
        unsolved: { $sum: { $cond: [{ $eq: ['$status', 'Unsolved'] }, 1, 0] } },
        easy: { $sum: { $cond: [{ $eq: ['$difficulty', 'Easy'] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ['$difficulty', 'Medium'] }, 1, 0] } },
        hard: { $sum: { $cond: [{ $eq: ['$difficulty', 'Hard'] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const rowMap = new Map(rows.map((r) => [r._id, r]));

  // Always return every supported topic so the UI can show full coverage.
  const data = TOPICS.map((topic) => {
    const r = rowMap.get(topic);
    const total = r ? r.total : 0;
    const solved = r ? r.solved : 0;
    return {
      topic,
      total,
      solved,
      attempted: r ? r.attempted : 0,
      unsolved: r ? r.unsolved : 0,
      completionPercentage: pct(solved, total),
      difficulty: {
        Easy: r ? r.easy : 0,
        Medium: r ? r.medium : 0,
        Hard: r ? r.hard : 0,
      },
    };
  });

  const weakTopics = data
    .filter((t) => t.total >= 3 && t.completionPercentage < 50)
    .sort((a, b) => a.completionPercentage - b.completionPercentage || b.total - a.total)
    .map((t) => ({ topic: t.topic, total: t.total, solved: t.solved, completionPercentage: t.completionPercentage }));

  const started = data.filter((t) => t.total > 0);
  const aggregate = {
    totalQuestions: data.reduce((s, t) => s + t.total, 0),
    totalSolved: data.reduce((s, t) => s + t.solved, 0),
    topicsStarted: started.length,
    topicsCompleted: started.filter((t) => t.completionPercentage === 100).length,
  };

  return sendSuccess(res, { topics: data, weakTopics, aggregate });
});

/**
 * GET /api/analytics/difficulty
 * Counts and completion rates per difficulty level.
 */
const difficulty = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const rows = await Problem.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: { difficulty: '$difficulty', status: '$status' },
        count: { $sum: 1 },
      },
    },
  ]);

  const data = {};
  DIFFICULTIES.forEach((d) => {
    data[d] = { total: 0, solved: 0, attempted: 0, unsolved: 0, completionPercentage: 0 };
  });

  rows.forEach((row) => {
    const d = row._id.difficulty;
    if (!data[d]) return;
    data[d].total += row.count;
    if (row._id.status === 'Solved') data[d].solved += row.count;
    else if (row._id.status === 'Attempted') data[d].attempted += row.count;
    else if (row._id.status === 'Unsolved') data[d].unsolved += row.count;
  });

  DIFFICULTIES.forEach((d) => {
    data[d].completionPercentage = pct(data[d].solved, data[d].total);
  });

  const total = DIFFICULTIES.reduce((s, d) => s + data[d].total, 0);
  const solved = DIFFICULTIES.reduce((s, d) => s + data[d].solved, 0);

  const chart = DIFFICULTIES.map((d) => ({
    name: d,
    total: data[d].total,
    solved: data[d].solved,
    completionPercentage: data[d].completionPercentage,
  }));

  return sendSuccess(res, { summary: { total, solved, completionPercentage: pct(solved, total) }, data, chart });
});

/**
 * GET /api/analytics/activity?days=7|30|90|365
 * Daily solved counts over the requested window (default 30, capped at 366).
 */
const activity = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const requested = parseInt(req.query.days, 10);
  const days = Math.min(366, Math.max(1, Number.isFinite(requested) ? requested : 30));

  const docs = await Problem.find({
    userId,
    status: 'Solved',
    solvedAt: { $ne: null },
  })
    .select('solvedAt')
    .lean();

  const counts = countByDay(docs.map((d) => d.solvedAt));
  const series = buildActivitySeries(lastNDayKeys(days), counts);
  const totalSolved = series.reduce((s, point) => s + point.count, 0);

  return sendSuccess(res, { days, totalSolved, series });
});

module.exports = { overview, topics, difficulty, activity };
