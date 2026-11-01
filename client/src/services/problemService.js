import api from './api';

/**
 * Problem (question) service.
 * `params` supports: page, limit, search, topic, difficulty, status, platform, sort.
 */
export async function fetchProblems(params = {}) {
  const res = await api.get('/problems', { params });
  return res.data.data; // { items, pagination }
}

export async function fetchProblem(id) {
  const res = await api.get(`/problems/${id}`);
  return res.data.data;
}

export async function createProblem(payload) {
  const res = await api.post('/problems', payload);
  return res.data.data;
}

export async function updateProblem(id, payload) {
  const res = await api.patch(`/problems/${id}`, payload);
  return res.data.data;
}

export async function deleteProblem(id) {
  const res = await api.delete(`/problems/${id}`);
  return res.data.data;
}

export async function updateProblemStatus(id, status) {
  const res = await api.patch(`/problems/${id}/status`, { status });
  return res.data.data;
}
