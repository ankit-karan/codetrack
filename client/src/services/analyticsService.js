import api from './api';

/** GET /api/analytics/overview */
export async function fetchOverview() {
  const res = await api.get('/analytics/overview');
  return res.data.data;
}

/** GET /api/analytics/topics */
export async function fetchTopicAnalytics() {
  const res = await api.get('/analytics/topics');
  return res.data.data;
}

/** GET /api/analytics/difficulty */
export async function fetchDifficultyAnalytics() {
  const res = await api.get('/analytics/difficulty');
  return res.data.data;
}

/** GET /api/analytics/activity?days=N */
export async function fetchActivity(days = 30) {
  const res = await api.get('/analytics/activity', { params: { days } });
  return res.data.data;
}
