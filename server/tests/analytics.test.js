const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const { registerUser, authed } = require('./helpers');

let user;

const base = {
  platform: 'LeetCode',
  topic: 'Arrays',
  difficulty: 'Easy',
  status: 'Solved',
};

beforeAll(async () => {
  await connectTestDB();
  user = await registerUser(app, { email: 'analytics@test.dev' });
});

afterEach(async () => {
  const Problem = require('../src/models/Problem');
  const Revision = require('../src/models/Revision');
  await Problem.deleteMany({});
  await Revision.deleteMany({});
});

afterAll(async () => {
  await closeTestDB();
});

async function seedProblems(specs) {
  for (const spec of specs) {
    await request(app)
      .post('/api/problems')
      .set(authed(user.token))
      .send({ ...base, ...spec });
  }
}

const authedGet = (path) => request(app).get(path).set(authed(user.token));

describe('GET /api/analytics/overview', () => {
  it('returns all zeros for a brand-new user (no misleading analytics)', async () => {
    const res = await authedGet('/api/analytics/overview');

    expect(res.status).toBe(200);
    const { totals, completionPercentage, streak } = res.body.data;
    expect(totals.total).toBe(0);
    expect(totals.solved).toBe(0);
    expect(completionPercentage).toBe(0);
    expect(streak.current).toBe(0);
    expect(streak.longest).toBe(0);
  });

  it('computes totals where total = solved + attempted + unsolved', async () => {
    await seedProblems([
      { title: 'Q1', status: 'Solved' },
      { title: 'Q2', status: 'Solved' },
      { title: 'Q3', status: 'Attempted' },
      { title: 'Q4', status: 'Unsolved' },
      { title: 'Q5', difficulty: 'Hard', status: 'Solved' },
    ]);

    const res = await authedGet('/api/analytics/overview');
    const { totals, completionPercentage } = res.body.data;

    expect(totals.total).toBe(5);
    expect(totals.solved).toBe(3);
    expect(totals.attempted).toBe(1);
    expect(totals.unsolved).toBe(1);
    expect(totals.solved + totals.attempted + totals.unsolved).toBe(totals.total);

    // 3/5 solved = 60%
    expect(completionPercentage).toBe(60);

    // Difficulty counts must also sum to total.
    expect(totals.easy + totals.medium + totals.hard).toBe(totals.total);
    expect(totals.difficultyTotal).toBe(totals.total);
  });

  it('computes the current streak from actual solvedAt dates', async () => {
    const Problem = require('../src/models/Problem');
    const now = Date.now();
    const DAY = 86400000;

    // Solve on each of the last 3 consecutive days (today, yesterday, 2 days ago).
    await seedProblems([
      { title: 'Today' },
      { title: 'Yesterday' },
      { title: 'Two days ago' },
    ]);

    const docs = await Problem.find({ userId: user.user.id });
    docs[0].solvedAt = new Date(now);
    docs[1].solvedAt = new Date(now - DAY);
    docs[2].solvedAt = new Date(now - 2 * DAY);
    await Promise.all(docs.map((d) => d.save()));

    const res = await authedGet('/api/analytics/overview');
    expect(res.body.data.streak.current).toBe(3);
    expect(res.body.data.activity.solvedToday).toBe(1);
    expect(res.body.data.activity.solvedThisWeek).toBe(3);
  });

  it('breaks the streak when a day is missed (streak counts yesterday only)', async () => {
    const Problem = require('../src/models/Problem');
    const now = Date.now();
    const DAY = 86400000;

    await seedProblems([{ title: 'Recent' }, { title: 'Old gap' }]);
    const docs = await Problem.find({ userId: user.user.id });
    docs[0].solvedAt = new Date(now - DAY); // yesterday
    docs[1].solvedAt = new Date(now - 3 * DAY); // 3 days ago (gap in between)
    await Promise.all(docs.map((d) => d.save()));

    const res = await authedGet('/api/analytics/overview');
    // Yesterday keeps the streak at 1; the older isolated day does not extend it.
    expect(res.body.data.streak.current).toBe(1);
    expect(res.body.data.streak.longest).toBe(1);
  });
});

describe('GET /api/analytics/difficulty', () => {
  it('reports accurate per-difficulty totals and completion rates', async () => {
    await seedProblems([
      { title: 'E1', difficulty: 'Easy', status: 'Solved' },
      { title: 'E2', difficulty: 'Easy', status: 'Attempted' },
      { title: 'M1', difficulty: 'Medium', status: 'Solved' },
      { title: 'H1', difficulty: 'Hard', status: 'Unsolved' },
    ]);

    const res = await authedGet('/api/analytics/difficulty');
    const { data, summary } = res.body.data;

    expect(data.Easy.total).toBe(2);
    expect(data.Easy.solved).toBe(1);
    expect(data.Easy.completionPercentage).toBe(50);
    expect(data.Medium.total).toBe(1);
    expect(data.Medium.completionPercentage).toBe(100);
    expect(data.Hard.total).toBe(1);
    expect(data.Hard.completionPercentage).toBe(0);

    expect(summary.total).toBe(4);
    expect(summary.solved).toBe(2);
    expect(summary.completionPercentage).toBe(50);
  });
});

describe('GET /api/analytics/topics', () => {
  it('returns every supported topic with accurate per-topic stats', async () => {
    await seedProblems([
      { title: 'A1', topic: 'Arrays', status: 'Solved' },
      { title: 'A2', topic: 'Arrays', status: 'Solved' },
      { title: 'A3', topic: 'Arrays', status: 'Unsolved' },
      { title: 'S1', topic: 'Strings', status: 'Attempted' },
    ]);

    const res = await authedGet('/api/analytics/topics');
    const { topics, weakTopics, aggregate } = res.body.data;

    // All 18 supported topics are always present.
    expect(topics).toHaveLength(18);

    const arrays = topics.find((t) => t.topic === 'Arrays');
    expect(arrays.total).toBe(3);
    expect(arrays.solved).toBe(2);
    expect(arrays.completionPercentage).toBe(67); // 2/3 rounded

    const strings = topics.find((t) => t.topic === 'Strings');
    expect(strings.total).toBe(1);
    expect(strings.solved).toBe(0);

    expect(aggregate.totalQuestions).toBe(4);
    expect(aggregate.totalSolved).toBe(2);

    // Weak topic rule: >= 3 questions and < 50% solved.
    expect(weakTopics.some((t) => t.topic === 'Arrays')).toBe(false); // 67% solved
    // Topics with < 3 questions never count as "weak".
    expect(weakTopics.some((t) => t.topic === 'Strings')).toBe(false);
  });

  it('flags genuinely weak topics (many attempts, low solve rate)', async () => {
    await seedProblems([
      { title: 'G1', topic: 'Graphs', status: 'Solved' },
      { title: 'G2', topic: 'Graphs', status: 'Unsolved' },
      { title: 'G3', topic: 'Graphs', status: 'Unsolved' },
      { title: 'G4', topic: 'Graphs', status: 'Attempted' },
    ]);

    const res = await authedGet('/api/analytics/topics');
    const graphs = res.body.data.weakTopics.find((t) => t.topic === 'Graphs');

    expect(graphs).toBeDefined();
    expect(graphs.solved).toBe(1);
    expect(graphs.completionPercentage).toBe(25);
  });
});

describe('GET /api/analytics/activity', () => {
  it('returns a zero-filled daily series with correct counts', async () => {
    const Problem = require('../src/models/Problem');

    await seedProblems([{ title: 'Today solve' }]);
    const doc = await Problem.findOne({ userId: user.user.id });
    doc.solvedAt = new Date();
    await doc.save();

    const res = await authedGet('/api/analytics/activity?days=7');

    expect(res.status).toBe(200);
    expect(res.body.data.series).toHaveLength(7);
    expect(res.body.data.totalSolved).toBe(1);
    expect(res.body.data.series[6].count).toBe(1); // today is the last point
    expect(res.body.data.series.slice(0, 6).every((p) => p.count === 0)).toBe(true);
  });

  it('caps the requested window at 366 days', async () => {
    const res = await authedGet('/api/analytics/activity?days=9999');
    expect(res.body.data.days).toBe(366);
    expect(res.body.data.series).toHaveLength(366);
  });
});
