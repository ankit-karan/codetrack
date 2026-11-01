const Problem = require('../models/Problem');
const Revision = require('../models/Revision');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

/** Fields a client is allowed to write on a problem. */
const WRITABLE_FIELDS = [
  'title',
  'platform',
  'problemUrl',
  'topic',
  'difficulty',
  'status',
  'timeComplexity',
  'spaceComplexity',
  'notes',
  'programmingLanguage',
];

function pickWritable(body) {
  const out = {};
  WRITABLE_FIELDS.forEach((field) => {
    if (body[field] !== undefined) out[field] = body[field];
  });
  return out;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GET /api/problems
 * Filter: topic, difficulty, status, platform, search (title).
 * Sort: createdAt (default), title, difficulty. Paginated.
 */
const listProblems = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));

  const query = { userId };
  if (req.query.topic) query.topic = req.query.topic;
  if (req.query.difficulty) query.difficulty = req.query.difficulty;
  if (req.query.status) query.status = req.query.status;
  if (req.query.platform) query.platform = req.query.platform;
  if (req.query.search && req.query.search.trim()) {
    // Case-insensitive partial match on the title only.
    query.title = { $regex: escapeRegex(req.query.search.trim()), $options: 'i' };
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    title: { title: 1 },
    difficulty: { difficulty: 1 },
  };
  const sort = sortMap[req.query.sort] || sortMap.newest;

  const [items, total] = await Promise.all([
    Problem.find(query).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Problem.countDocuments(query),
  ]);

  return sendSuccess(res, {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
});

/**
 * POST /api/problems
 */
const createProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.create({
    ...pickWritable(req.body),
    userId: req.user._id,
  });
  return sendSuccess(res, problem, 201);
});

/**
 * GET /api/problems/:id  (ownership enforced)
 */
const getProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.findOne({ _id: req.params.id, userId: req.user._id });
  if (!problem) throw ApiError.notFound('Question not found.');
  return sendSuccess(res, problem);
});

/**
 * PATCH /api/problems/:id  (ownership enforced)
 */
const updateProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.findOne({ _id: req.params.id, userId: req.user._id });
  if (!problem) throw ApiError.notFound('Question not found.');

  Object.assign(problem, pickWritable(req.body));
  // pre('save') keeps solvedAt in sync with the new status.
  await problem.save();

  return sendSuccess(res, problem);
});

/**
 * DELETE /api/problems/:id  (ownership enforced, cascades to revisions)
 */
const deleteProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!problem) throw ApiError.notFound('Question not found.');

  // Orphaned revisions are useless — remove them with their parent.
  await Revision.deleteMany({ userId: req.user._id, problemId: problem._id });

  return sendSuccess(res, { id: problem._id.toString(), deleted: true });
});

/**
 * PATCH /api/problems/:id/status  — lightweight status toggle used by the UI.
 */
const updateProblemStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const problem = await Problem.findOne({ _id: req.params.id, userId: req.user._id });
  if (!problem) throw ApiError.notFound('Question not found.');

  problem.status = status;
  await problem.save();

  return sendSuccess(res, problem);
});

module.exports = {
  listProblems,
  createProblem,
  getProblem,
  updateProblem,
  deleteProblem,
  updateProblemStatus,
};
