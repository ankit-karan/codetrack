const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const { registerUser } = require('./helpers');

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe('POST /api/auth/register', () => {
  it('registers a new user and returns a JWT + safe user payload', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ankit Kumar', email: 'ankit@test.dev', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('ankit@test.dev');
    // Password must never leak in the response.
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('hashes the password (never stored in plain text)', async () => {
    const { user } = await registerUser(app, { email: 'hash@test.dev' });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'password123' });

    expect(login.status).toBe(200);

    const User = require('../src/models/User');
    const dbUser = await User.findOne({ email: 'hash@test.dev' }).select('+password');
    expect(dbUser.password).not.toBe('password123');
    expect(dbUser.password.startsWith('$2')).toBe(true); // bcrypt prefix
  });

  it('rejects duplicate emails with 409', async () => {
    await registerUser(app, { email: 'dupe@test.dev' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Duplicate', email: 'dupe@test.dev', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects an invalid email with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bad Email', email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'email')).toBe(true);
  });

  it('rejects a short password with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Short Pw', email: 'short@test.dev', password: '123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await registerUser(app, { email: 'login@test.dev', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.dev', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it('rejects a wrong password with 401', async () => {
    await registerUser(app, { email: 'login2@test.dev' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login2@test.dev', password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('rejects an unknown email with 401 (no user enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.dev', password: 'password123' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user with a valid token', async () => {
    const { token, user } = await registerUser(app);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(user.id);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a garbage token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.real.token');

    expect(res.status).toBe(401);
  });
});
