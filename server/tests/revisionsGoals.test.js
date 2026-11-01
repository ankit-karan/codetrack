const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const { registerUser, authed } = require('./helpers');

let alice;
let bob;

const DAY = 86400000;

async function createProblem(token, overrides = {}) {
  const res = await request(app)
    .post('/api/problems')
    .set(authed(token))
    .send({
      title: 'Two Sum',
      topic: 'Arrays',
      difficulty: 'Easy',
      status: 'Solved',
      ...overrides,
    });
  return res.body.data;
}

beforeAll(async () => {
  await connectTestDB();
  alice = await registerUser(app, { email: 'rev-alice@test.dev' });
  bob = await registerUser(app, { email: 'rev-bob@test.dev' });
});

afterEach(async () => {
  const Problem = require('../src/models/Problem');
  const Revision = require('../src/models/Revision');
  const Goal = require('../src/models/Goal');
  await Problem.deleteMany({});
  await Revision.deleteMany({});
  await Goal.deleteMany({});
});

afterAll(async () => {
  await closeTestDB();
});

describe('Revisions API', () => {
  it('schedules a revision for a question the user owns', async () => {
    const problem = await createProblem(alice.token);

    const res = await request(app)
      .post('/api/revisions')
      .set(authed(alice.token))
      .send({ problemId: problem._id, revisionDate: new Date(Date.now() + DAY).toISOString() });

    expect(res.status).toBe(201);
    expect(res.body.data.problemId.title).toBe('Two Sum');
    expect(res.body.data.completed).toBe(false);
  });

  it('rejects scheduling a revision on another user\'s question', async () => {
    const problem = await createProblem(alice.token);

    const res = await request(app)
      .post('/api/revisions')
      .set(authed(bob.token))
      .send({ problemId: problem._id, revisionDate: new Date(Date.now() + DAY).toISOString() });

    expect(res.status).toBe(404);
  });

  it('rejects a duplicate upcoming revision (409)', async () => {
    const problem = await createProblem(alice.token);
    const payload = { problemId: problem._id, revisionDate: new Date(Date.now() + DAY).toISOString() };

    await request(app).post('/api/revisions').set(authed(alice.token)).send(payload);
    const dup = await request(app).post('/api/revisions').set(authed(alice.token)).send(payload);

    expect(dup.status).toBe(409);
  });

  it('separates upcoming, overdue and completed revisions with accurate counts', async () => {
    const p1 = await createProblem(alice.token, { title: 'Upcoming One' });
    const p2 = await createProblem(alice.token, { title: 'Overdue One' });
    const p3 = await createProblem(alice.token, { title: 'Completed One' });

    const r1 = await request(app).post('/api/revisions').set(authed(alice.token))
      .send({ problemId: p1._id, revisionDate: new Date(Date.now() + DAY).toISOString() });
    const r2 = await request(app).post('/api/revisions').set(authed(alice.token))
      .send({ problemId: p2._id, revisionDate: new Date(Date.now() - DAY).toISOString() });
    const r3 = await request(app).post('/api/revisions').set(authed(alice.token))
      .send({ problemId: p3._id, revisionDate: new Date(Date.now() - 2 * DAY).toISOString() });

    // Complete the third revision.
    const completed = await request(app)
      .patch(`/api/revisions/${r3.body.data._id}`)
      .set(authed(alice.token))
      .send({ completed: true });

    expect(completed.status).toBe(200);
    expect(completed.body.data.completedAt).toBeTruthy();

    const all = await request(app).get('/api/revisions').set(authed(alice.token));
    expect(all.body.data.counts.total).toBe(3);

    const upcoming = await request(app).get('/api/revisions?status=upcoming').set(authed(alice.token));
    expect(upcoming.body.data.items).toHaveLength(1);
    expect(upcoming.body.data.items[0]._id).toBe(r1.body.data._id);

    const overdue = await request(app).get('/api/revisions?status=overdue').set(authed(alice.token));
    expect(overdue.body.data.items).toHaveLength(1);
    expect(overdue.body.data.items[0]._id).toBe(r2.body.data._id);

    const done = await request(app).get('/api/revisions?status=completed').set(authed(alice.token));
    expect(done.body.data.items).toHaveLength(1);
    expect(done.body.data.counts.completed).toBe(1);
  });

  it('deletes only the owner\'s revision', async () => {
    const problem = await createProblem(alice.token);
    const rev = await request(app).post('/api/revisions').set(authed(alice.token))
      .send({ problemId: problem._id, revisionDate: new Date(Date.now() + DAY).toISOString() });

    const res = await request(app)
      .delete(`/api/revisions/${rev.body.data._id}`)
      .set(authed(bob.token));

    expect(res.status).toBe(404);

    const mine = await request(app)
      .delete(`/api/revisions/${rev.body.data._id}`)
      .set(authed(alice.token));
    expect(mine.status).toBe(200);
  });
});

describe('Goals API', () => {
  it('returns null goal and zeroed progress for a new user', async () => {
    const res = await request(app).get('/api/goals').set(authed(bob.token));

    expect(res.status).toBe(200);
    expect(res.body.data.goal).toBeNull();
    expect(res.body.data.progress.daily.target).toBe(3); // user dailyGoal default
    expect(res.body.data.progress.daily.solved).toBe(0);
  });

  it('creates a goal, deactivating the previous one', async () => {
    const first = await request(app)
      .post('/api/goals')
      .set(authed(alice.token))
      .send({ dailyTarget: 2, weeklyTarget: 10 });

    expect(first.status).toBe(201);
    expect(first.body.data.goal.active).toBe(true);

    const second = await request(app)
      .post('/api/goals')
      .set(authed(alice.token))
      .send({ dailyTarget: 4, weeklyTarget: 20 });

    expect(second.status).toBe(201);

    const Goal = require('../src/models/Goal');
    const active = await Goal.find({ userId: alice.user.id, active: true });
    expect(active).toHaveLength(1);
    expect(active[0].weeklyTarget).toBe(20);
  });

  it('computes daily/weekly progress from actual solve dates', async () => {
    await request(app)
      .post('/api/goals')
      .set(authed(alice.token))
      .send({ dailyTarget: 3, weeklyTarget: 10 });

    // Solve 2 questions "today".
    const Problem = require('../src/models/Problem');
    await createProblem(alice.token, { title: 'Today A' });
    await createProblem(alice.token, { title: 'Today B' });
    await Problem.updateMany({ userId: alice.user.id, solvedAt: null }, { $set: { solvedAt: new Date() } });

    const res = await request(app).get('/api/goals').set(authed(alice.token));

    expect(res.body.data.goal.dailyTarget).toBe(3);
    expect(res.body.data.progress.daily.solved).toBe(2);
    expect(res.body.data.progress.daily.percentage).toBe(67);
    expect(res.body.data.progress.daily.completed).toBe(false);
    expect(res.body.data.progress.weekly.solved).toBe(2);
    expect(res.body.data.progress.weekly.target).toBe(10);
  });

  it('updates goal targets with PATCH', async () => {
    const created = await request(app)
      .post('/api/goals')
      .set(authed(alice.token))
      .send({ dailyTarget: 2, weeklyTarget: 8 });

    const res = await request(app)
      .patch(`/api/goals/${created.body.data.goal._id}`)
      .set(authed(alice.token))
      .send({ dailyTarget: 5, weeklyTarget: 25 });

    expect(res.status).toBe(200);
    expect(res.body.data.goal.dailyTarget).toBe(5);
    expect(res.body.data.goal.weeklyTarget).toBe(25);
  });

  it('does not allow editing another user\'s goal', async () => {
    const created = await request(app)
      .post('/api/goals')
      .set(authed(alice.token))
      .send({ dailyTarget: 2, weeklyTarget: 8 });

    const res = await request(app)
      .patch(`/api/goals/${created.body.data.goal._id}`)
      .set(authed(bob.token))
      .send({ dailyTarget: 7 });

    expect(res.status).toBe(404);
  });
});
