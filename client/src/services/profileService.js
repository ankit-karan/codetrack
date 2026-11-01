import api from './api';

/** GET /api/profile */
export async function fetchProfile() {
  const res = await api.get('/profile');
  return res.data.data; // { user, stats }
}

/** PATCH /api/profile */
export async function updateProfile(payload) {
  const res = await api.patch('/profile', payload);
  return res.data.data; // { user, passwordChanged }
}
