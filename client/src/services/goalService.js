import api from './api';

/** GET /api/goals */
export async function fetchGoals() {
  const res = await api.get('/goals');
  return res.data.data; // { goal, progress }
}

export async function createGoal(payload) {
  const res = await api.post('/goals', payload);
  return res.data.data;
}

export async function updateGoal(id, payload) {
  const res = await api.patch(`/goals/${id}`, payload);
  return res.data.data;
}
