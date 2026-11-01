const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const { registerUser, authed } = require('./helpers');

let user;

beforeAll(async () => {
  await connectTestDB();
  user = await registerUser(app, { email: 'profile@test.dev', name: 'Profile User' });
});

afterEach(async () => {
  const Problem = require('../src/models/Problem');
  await Problem.deleteMany({});
});

afterAll(async () => {
  await closeTestDB();
});

describe('GET /api/profile', () => {
  it('returns the profile with real stats', async () => {
    const res = await request(app).get('/api/profile').set(authed(user.token));

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Profile User');
    expect(res.body.data.user.email).toBe('profile@test.dev');
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.stats).toEqual({ totalQuestions: 0, solvedQuestions: 0 });
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/profile', () => {
  it('updates name, dailyGoal and coding profiles', async () => {
    const res = await request(app)
      .patch('/api/profile')
      .set(authed(user.token))
      .send({
        name: 'Updated Name',
        dailyGoal: 5,
        codingProfiles: {
          leetcode: 'https://leetcode.com/u/ankit/',
          geeksforgeeks: 'https://www.geeksforgeeks.org/user/ankit/',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Updated Name');
    expect(res.body.data.user.dailyGoal).toBe(5);
    expect(res.body.data.user.codingProfiles.leetcode).toContain('leetcode.com');
    expect(res.body.data.passwordChanged).toBe(false);
  });

  it('rejects an out-of-range dailyGoal', async () => {
    const res = await request(app)
      .patch('/api/profile')
      .set(authed(user.token))
      .send({ dailyGoal: 500 });

    expect(res.status).toBe(400);
  });

  it('rejects an invalid coding profile URL', async () => {
    const res = await request(app)
      .patch('/api/profile')
      .set(authed(user.token))
      .send({ codingProfiles: { leetcode: 'definitely not a url' } });

    expect(res.status).toBe(400);
  });

  it('changes the password when current + new password are supplied', async () => {
    const res = await request(app)
      .patch('/api/profile')
      .set(authed(user.token))
      .send({ currentPassword: 'password123', newPassword: 'newpassword456' });

    expect(res.status).toBe(200);
    expect(res.body.data.passwordChanged).toBe(true);

    // Old password no longer works.
    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: user.user.email, password: 'password123' });
    expect(oldLogin.status).toBe(401);

    // New password works.
    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: user.user.email, password: 'newpassword456' });
    expect(newLogin.status).toBe(200);
  });

  it('rejects an incorrect current password', async () => {
    const res = await request(app)
      .patch('/api/profile')
      .set(authed(user.token))
      .send({ currentPassword: 'wrong-password', newPassword: 'newpassword456' });

    expect(res.status).toBe(400);
  });
});
