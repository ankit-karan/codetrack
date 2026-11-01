const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const { registerUser, authed } = require('./helpers');

let alice;
let bob;

const sampleProblem = {
  title: 'Two Sum',
  platform: 'LeetCode',
  problemUrl: 'https://leetcode.com/problems/two-sum/',
  topic: 'Arrays',
  difficulty: 'Easy',
  status: 'Solved',
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(n)',
  notes: 'Use a hash map of seen values.',
  programmingLanguage: 'C++',
};

beforeAll(async () => {
  await connectTestDB();
  alice = await registerUser(app, { email: 'alice@test.dev' });
  bob = await registerUser(app, { email: 'bob@test.dev' });
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

describe('POST /api/problems', () => {
  it('creates a question for the authenticated user', async () => {
    const res = await request(app)
      .post('/api/problems')
      .set(authed(alice.token))
      .send(sampleProblem);

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Two Sum');
    expect(res.body.data.userId).toBeDefined();
    // Solved problems must get a solvedAt timestamp automatically.
    expect(res.body.data.solvedAt).toBeTruthy();
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/problems').send(sampleProblem);
    expect(res.status).toBe(401);
  });

  it('rejects an invalid topic with 400', async () => {
    const res = await request(app)
      .post('/api/problems')
      .set(authed(alice.token))
      .send({ ...sampleProblem, topic: 'Blockchain' });

    expect(res.status).toBe(400);
  });

  it('rejects a missing title with 400', async () => {
    const res = await request(app)
      .post('/api/problems')
      .set(authed(alice.token))
      .send({ ...sampleProblem, title: '' });

    expect(res.status).toBe(400);
  });

  it('rejects a malformed URL with 400', async () => {
    const res = await request(app)
      .post('/api/problems')
      .set(authed(alice.token))
      .send({ ...sampleProblem, problemUrl: 'not-a-url' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/problems', () => {
  beforeEach(async () => {
    // 12 questions for alice, 2 for bob (data isolation fixture)
    for (let i = 1; i <= 12; i += 1) {
      await request(app)
        .post('/api/problems')
        .set(authed(alice.token))
        .send({
          ...sampleProblem,
          title: `Alice Question ${i}`,
          topic: i % 2 === 0 ? 'Arrays' : 'Stack',
          difficulty: i % 3 === 0 ? 'Hard' : 'Easy',
          status: i <= 6 ? 'Solved' : 'Unsolved',
        });
    }
    for (let i = 1; i <= 2; i += 1) {
      await request(app)
        .post('/api/problems')
        .set(authed(bob.token))
        .send({ ...sampleProblem, title: `Bob Question ${i}` });
    }
  });

  it('only returns the requesting user\'s questions', async () => {
    const res = await request(app)
      .get('/api/problems')
      .set(authed(alice.token));

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.total).toBe(12);
    expect(res.body.data.items.every((p) => p.title.startsWith('Alice'))).toBe(true);
  });

  it('paginates correctly', async () => {
    const page1 = await request(app)
      .get('/api/problems?page=1&limit=5')
      .set(authed(alice.token));
    const page3 = await request(app)
      .get('/api/problems?page=3&limit=5')
      .set(authed(alice.token));

    expect(page1.body.data.items).toHaveLength(5);
    expect(page1.body.data.pagination.hasNext).toBe(true);
    expect(page3.body.data.items).toHaveLength(2);
    expect(page3.body.data.pagination.hasNext).toBe(false);
    expect(page3.body.data.pagination.totalPages).toBe(3);
  });

  it('filters by status', async () => {
    const res = await request(app)
      .get('/api/problems?status=Solved')
      .set(authed(alice.token));

    expect(res.body.data.items).toHaveLength(6);
    expect(res.body.data.pagination.total).toBe(6);
  });

  it('filters by topic and difficulty together', async () => {
    const res = await request(app)
      .get('/api/problems?topic=Arrays&difficulty=Easy')
      .set(authed(alice.token));

    expect(res.body.data.items.every((p) => p.topic === 'Arrays' && p.difficulty === 'Easy')).toBe(true);
  });

  it('searches by title (case-insensitive)', async () => {
    const res = await request(app)
      .get('/api/problems?search=alice%20question%2010')
      .set(authed(alice.token));

    expect(res.body.data.pagination.total).toBe(1);
    expect(res.body.data.items[0].title).toBe('Alice Question 10');
  });

  it('returns an empty page gracefully for a search with no results', async () => {
    const res = await request(app)
      .get('/api/problems?search=zzz-nothing')
      .set(authed(alice.token));

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
    expect(res.body.data.pagination.total).toBe(0);
  });
});

describe('PATCH /api/problems/:id', () => {
  it('updates a question and keeps solvedAt in sync with status', async () => {
    const created = await request(app)
      .post('/api/problems')
      .set(authed(alice.token))
      .send({ ...sampleProblem, status: 'Unsolved' });

    const id = created.body.data._id;
    expect(created.body.data.solvedAt).toBeNull();

    // Mark as solved -> solvedAt gets stamped
    const solved = await request(app)
      .patch(`/api/problems/${id}`)
      .set(authed(alice.token))
      .send({ status: 'Solved' });

    expect(solved.status).toBe(200);
    expect(solved.body.data.solvedAt).toBeTruthy();

    // Back to unsolved -> solvedAt cleared
    const unsolved = await request(app)
      .patch(`/api/problems/${id}`)
      .set(authed(alice.token))
      .send({ status: 'Unsolved' });

    expect(unsolved.body.data.solvedAt).toBeNull();
  });

  it('returns 404 for another user\'s question (ownership enforced)', async () => {
    const created = await request(app)
      .post('/api/problems')
      .set(authed(alice.token))
      .send(sampleProblem);

    const res = await request(app)
      .patch(`/api/problems/${created.body.data._id}`)
      .set(authed(bob.token))
      .send({ title: 'Hijacked' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/problems/:id', () => {
  it('deletes a question and cascades its revisions', async () => {
    const Revision = require('../src/models/Revision');

    const created = await request(app)
      .post('/api/problems')
      .set(authed(alice.token))
      .send(sampleProblem);
    const id = created.body.data._id;

    await request(app)
      .post('/api/revisions')
      .set(authed(alice.token))
      .send({ problemId: id, revisionDate: new Date(Date.now() + 86400000).toISOString() });

    expect(await Revision.countDocuments({})).toBe(1);

    const res = await request(app)
      .delete(`/api/problems/${id}`)
      .set(authed(alice.token));

    expect(res.status).toBe(200);
    expect(await Revision.countDocuments({})).toBe(0);
  });

  it('returns 404 when deleting another user\'s question', async () => {
    const created = await request(app)
      .post('/api/problems')
      .set(authed(alice.token))
      .send(sampleProblem);

    const res = await request(app)
      .delete(`/api/problems/${created.body.data._id}`)
      .set(authed(bob.token));

    expect(res.status).toBe(404);
  });
});
