const request = require('supertest');

/** Create a fresh account and return { token, user } for scoping tests. */
async function registerUser(app, overrides = {}) {
  const payload = {
    name: overrides.name || 'Test User',
    email: overrides.email || `user-${Date.now()}-${Math.random().toString(36).slice(2)}@test.dev`,
    password: overrides.password || 'password123',
    ...overrides,
  };

  const res = await request(app).post('/api/auth/register').send(payload);

  if (res.status !== 201) {
    throw new Error(`registerUser failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return { token: res.body.data.token, user: res.body.data.user };
}

/** Standard authorized request helper. */
function authed(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = { registerUser, authed };
