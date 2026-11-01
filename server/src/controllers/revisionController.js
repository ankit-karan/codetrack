const Revision = require('../models/Revision');
const Problem = require('../models/Problem');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { startOfUTCDay } = require('../utils/dates');

const POPULATE = {
  path: 'problemId',
  select: 'title topic difficulty platform status problemUrl',
};

/**
 * GET /api/revisions?status=upcoming|overdue|completed|all
 * Defaults to 'all'. Always scoped to the authenticated user.
 */
const listRevisions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const status = req.query.status || 'all';
  const today = startOfUTCDay();

  const base = { userId };
  if (status === 'upcoming') base.completed = false;
  else if (status === 'overdue') { base.completed = false; base.revisionDate = { $lt: today }; }
  else if (status === 'completed') base.completed = true;
  else if (status === 'pending') base.completed = false;

  // 'upcoming' means pending revisions dated today or later.
  if (status === 'upcoming') base.revisionDate = { $gte: today };

  const sortMap = {
    upcoming: { revisionDate: 1 },
    overdue: { revisionDate: 1 },
    pending: { revisionDate: 1 },
    completed: { completedAt: -1 },
    all: { revisionDate: -1 },
  };

  const [items, counts] = await Promise.all([
    Revision.find(base).sort(sortMap[status] || sortMap.all).limit(500).populate(POPULATE).lean(),
    Promise.all([
      Revision.countDocuments({ userId, completed: false, revisionDate: { $gte: today } }),
      Revision.countDocuments({ userId, completed: false, revisionDate: { $lt: today } }),
      Revision.countDocuments({ userId, completed: true }),
      Revision.countDocuments({ userId, completed: false }),
    ]),
  ]);

  return sendSuccess(res, {
    items,
    counts: {
      upcoming: counts[0],
      overdue: counts[1],
      completed: counts[2],
      pending: counts[3],
      total: counts[0] + counts[1] + counts[2],
    },
  });
});

/**
 * POST /api/revisions  { problemId, revisionDate, note? }
 */
const createRevision = asyncHandler(async (req, res) => {
  const { problemId, revisionDate, note } = req.body;

  // Ownership check: users can only schedule their own questions.
  const problem = await Problem.findOne({ _id: problemId, userId: req.user._id });
  if (!problem) throw ApiError.notFound('Question not found.');

  const today = startOfUTCDay();
  const duplicate = await Revision.findOne({
    userId: req.user._id,
    problemId,
    completed: false,
    revisionDate: { $gte: today },
  });

  if (duplicate) {
    throw ApiError.conflict('This question already has an upcoming revision scheduled.');
  }

  const revision = await Revision.create({
    userId: req.user._id,
    problemId,
    revisionDate,
    note: note || '',
  });

  const populated = await revision.populate(POPULATE);
  return sendSuccess(res, populated, 201);
});

/**
 * PATCH /api/revisions/:id  { completed?, revisionDate? }
 */
const updateRevision = asyncHandler(async (req, res) => {
  const revision = await Revision.findOne({ _id: req.params.id, userId: req.user._id });
  if (!revision) throw ApiError.notFound('Revision not found.');

  if (req.body.completed !== undefined) revision.completed = req.body.completed;
  if (req.body.revisionDate !== undefined) revision.revisionDate = req.body.revisionDate;
  if (req.body.note !== undefined) revision.note = req.body.note;

  // pre('save') stamps/clears completedAt.
  await revision.save();
  const populated = await revision.populate(POPULATE);

  return sendSuccess(res, populated);
});

/**
 * DELETE /api/revisions/:id
 */
const deleteRevision = asyncHandler(async (req, res) => {
  const revision = await Revision.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!revision) throw ApiError.notFound('Revision not found.');
  return sendSuccess(res, { id: revision._id.toString(), deleted: true });
});

module.exports = { listRevisions, createRevision, updateRevision, deleteRevision };
