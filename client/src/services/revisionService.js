import api from './api';

/** GET /api/revisions?status=all|upcoming|overdue|completed */
export async function fetchRevisions(status = 'all') {
  const res = await api.get('/revisions', { params: { status } });
  return res.data.data; // { items, counts }
}

export async function createRevision(payload) {
  const res = await api.post('/revisions', payload);
  return res.data.data;
}

export async function updateRevision(id, payload) {
  const res = await api.patch(`/revisions/${id}`, payload);
  return res.data.data;
}

export async function deleteRevision(id) {
  const res = await api.delete(`/revisions/${id}`);
  return res.data.data;
}
