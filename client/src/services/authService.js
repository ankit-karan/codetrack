import api, { TOKEN_KEY } from './api';

/** POST /api/auth/register */
export async function registerUser(payload) {
  const res = await api.post('/auth/register', payload);
  const { token, user } = res.data.data;
  localStorage.setItem(TOKEN_KEY, token);
  return user;
}

/** POST /api/auth/login */
export async function loginUser(payload) {
  const res = await api.post('/auth/login', payload);
  const { token, user } = res.data.data;
  localStorage.setItem(TOKEN_KEY, token);
  return user;
}

/** GET /api/auth/me */
export async function fetchCurrentUser() {
  const res = await api.get('/auth/me');
  return res.data.data.user;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}
