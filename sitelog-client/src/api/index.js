import api, { setAccessToken } from './axios.js';

export const authApi = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.data.accessToken);
    return data.data;
  },
  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    setAccessToken(data.data.accessToken);
    return data.data;
  },
  logout: () => api.post('/auth/logout').finally(() => setAccessToken(null)),
  deleteAccount: () => api.delete('/auth/me').finally(() => setAccessToken(null)),
  getMe: () => api.get('/auth/me', { params: { _t: Date.now() } }).then((r) => r.data.data.user),
  updateProfile: (payload) => api.patch('/auth/profile', payload).then((r) => r.data.data.user),
  listUsers: () => api.get('/auth/users').then((r) => r.data.data),
  inviteUser: (payload) => api.post('/auth/invite', payload).then((r) => r.data.data),
};

export const projectApi = {
  list: () => api.get('/projects').then((r) => r.data.data),
  get: (id) => api.get(`/projects/${id}`).then((r) => r.data.data),
  create: (payload) => api.post('/projects', payload).then((r) => r.data.data),
  update: (id, payload) => api.put(`/projects/${id}`, payload).then((r) => r.data.data),
  delete: (id) => api.delete(`/projects/${id}`).then((r) => r.data.data),
  stats: (id) => api.get(`/projects/${id}/stats`).then((r) => r.data.data),
  shareLink: (id) => api.post(`/projects/${id}/share`).then((r) => r.data.data),
};

export const logApi = {
  list: (projectId, params) => api.get(`/projects/${projectId}/logs`, { params: { ...params, _t: Date.now() } }).then((r) => r.data.data),
  get: (projectId, logId) => api.get(`/projects/${projectId}/logs/${logId}`).then((r) => r.data.data),
  create: (projectId, payload) => api.post(`/projects/${projectId}/logs`, payload).then((r) => r.data.data),
  update: (projectId, logId, payload) => api.put(`/projects/${projectId}/logs/${logId}`, payload).then((r) => r.data.data),
  delete: (projectId, logId) => api.delete(`/projects/${projectId}/logs/${logId}`).then((r) => r.data.data),
};

export const issueApi = {
  list: (projectId) => api.get(`/projects/${projectId}/issues`).then((r) => r.data.data),
  get: (projectId, issueId) => api.get(`/projects/${projectId}/issues/${issueId}`).then((r) => r.data.data),
  create: (projectId, payload) => api.post(`/projects/${projectId}/issues`, payload).then((r) => r.data.data),
  update: (projectId, issueId, payload) => api.put(`/projects/${projectId}/issues/${issueId}`, payload).then((r) => r.data.data),
  delete: (projectId, issueId) => api.delete(`/projects/${projectId}/issues/${issueId}`).then((r) => r.data.data),
};

export const galleryApi = {
  list: (projectId) => api.get(`/projects/${projectId}/gallery`).then((r) => r.data.data),
  upload: (projectId, payload) => api.post(`/projects/${projectId}/gallery`, payload).then((r) => r.data),
  delete: (projectId, parentId, payload) => api.delete(`/projects/${projectId}/gallery/${parentId}`, { data: payload }).then((r) => r.data),
};

export const budgetApi = {
  get: (projectId) => api.get(`/projects/${projectId}/budget`).then((r) => r.data.data),
  createExpense: (projectId, payload) => api.post(`/projects/${projectId}/expenses`, payload).then((r) => r.data.data),
  deleteExpense: (projectId, expId) => api.delete(`/projects/${projectId}/expenses/${expId}`).then((r) => r.data.data),
  approveExpense: (projectId, expId) => api.post(`/projects/${projectId}/expenses/${expId}/approve`).then((r) => r.data.data),
};

export const milestoneApi = {
  list: (projectId) => api.get(`/projects/${projectId}/milestones`).then((r) => r.data.data),
  create: (projectId, payload) => api.post(`/projects/${projectId}/milestones`, payload).then((r) => r.data.data),
  update: (projectId, mId, payload) => api.put(`/projects/${projectId}/milestones/${mId}`, payload).then((r) => r.data.data),
  delete: (projectId, mId) => api.delete(`/projects/${projectId}/milestones/${mId}`).then((r) => r.data.data),
  approve: (projectId, mId) => api.post(`/projects/${projectId}/milestones/${mId}/approve`).then((r) => r.data.data),
};

export const documentApi = {
  list: (projectId) => api.get(`/projects/${projectId}/documents`).then((r) => r.data.data),
  upload: (projectId, file, metadata = {}) => {
    const form = new FormData();
    form.append('file', file);
    if (metadata.name) form.append('name', metadata.name);
    if (metadata.type) form.append('type', metadata.type);
    if (metadata.tags) form.append('tags', JSON.stringify(metadata.tags));
    return api.post(`/projects/${projectId}/documents`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data);
  },
  delete: (projectId, docId) => api.delete(`/projects/${projectId}/documents/${docId}`).then((r) => r.data.data),
  download: (projectId, docId) => api.get(`/projects/${projectId}/documents/${docId}/download`, { responseType: 'blob' }).then((r) => r.data),
};

export const notificationApi = {
  list: () => api.get('/notifications').then((r) => r.data.data),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};

export const vendorApi = {
  list: () => api.get('/vendors').then((r) => r.data.data),
  create: (payload) => api.post('/vendors', payload).then((r) => r.data.data),
  update: (id, payload) => api.put(`/vendors/${id}`, payload).then((r) => r.data.data),
  delete: (id) => api.delete(`/vendors/${id}`).then((r) => r.data.data),
  addSpend: (vendorId, payload) => api.post(`/vendors/${vendorId}/spend`, payload).then((r) => r.data.data),
};

export const materialApi = {
  list: (params) => api.get('/materials', { params }).then((r) => r.data.data),
  create: (payload) => api.post('/materials', payload).then((r) => r.data.data),
  update: (id, payload) => api.put(`/materials/${id}`, payload).then((r) => r.data.data),
  delete: (id) => api.delete(`/materials/${id}`).then((r) => r.data.data),
  addMovement: (id, payload) => api.post(`/materials/${id}/move`, payload).then((r) => r.data.data),
  listMovements: (id) => api.get(`/materials/${id}/logs`).then((r) => r.data.data),
  lowStock: () => api.get('/materials/low-stock').then((r) => r.data.data),
};

export const equipmentApi = {
  list: (params) => api.get('/equipment', { params }).then((r) => r.data.data),
  create: (payload) => api.post('/equipment', payload).then((r) => r.data.data),
  update: (id, payload) => api.put(`/equipment/${id}`, payload).then((r) => r.data.data),
  delete: (id) => api.delete(`/equipment/${id}`).then((r) => r.data.data),
  assign: (id, payload) => api.put(`/equipment/${id}/assign`, payload).then((r) => r.data.data),
  addService: (id, payload) => api.post(`/equipment/${id}/service`, payload).then((r) => r.data.data),
  listService: (id) => api.get(`/equipment/${id}/service`).then((r) => r.data.data),
  maintenanceDue: () => api.get('/equipment/maintenance-due').then((r) => r.data.data),
};

export const ownerApi = {
  get: (shareToken) => api.get(`/owner/${shareToken}`).then((r) => r.data.data),
};

export const plinthaiApi = {
  init: () => api.get('/plinthai/init', { params: { _t: Date.now() } }).then((r) => r.data.data),
  chat: (session_id, message) => api.post('/plinthai/chat', { session_id, message }).then((r) => r.data.data),
  feedback: (session_id, message_id, rating, comment) =>
    api.post('/plinthai/feedback', { session_id, message_id, rating, comment }).then((r) => r.data),
};

export const subscriptionApi = {
  plans: () => api.get('/subscription/plans').then((r) => r.data.data),
  status: () => api.get('/subscription/status').then((r) => r.data.data),
  selectPlan: (plan, billingCycle) => api.post('/subscription/select-plan', { plan, billingCycle }).then((r) => r.data),
};

export const verificationApi = {
  checkEmail: (email) => api.get('/auth/check-email', { params: { email } }).then((r) => r.data.data),
  sendVerification: () => api.post('/auth/send-verification').then((r) => r.data),
};

export const uploadApi = {
  file: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data);
  },
  photos: (files) => {
    const form = new FormData();
    files.forEach((f) => form.append('photos', f));
    return api.post('/upload/photos', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data);
  },
};

export function mediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  return `${base}${path}`;
}

// ── Invite API ──
export const inviteApi = {
  send: (payload) => api.post('/invite/send', payload).then((r) => r.data),
  verify: (token) => api.get(`/invite/verify/${token}`).then((r) => r.data),
  accept: (token) => api.post(`/invite/accept/${token}`).then((r) => r.data),
  list: () => api.get('/invite/list').then((r) => r.data.data),
  revoke: (id) => api.delete(`/invite/${id}`).then((r) => r.data),
};

// ── Team API ──
export const teamApi = {
  members: () => api.get('/team/members').then((r) => r.data.data),
  getMember: (id) => api.get(`/team/members/${id}`).then((r) => r.data.data),
  changeRole: (id, role) => api.patch(`/team/members/${id}/role`, { role }).then((r) => r.data.data),
  deactivate: (id) => api.patch(`/team/members/${id}/deactivate`).then((r) => r.data),
  deleteMember: (id, projectId) => api.delete(`/team/members/${id}`, { params: { projectId } }).then((r) => r.data),
};

// ── Chat API ──
export const chatApi = {
  getMessages: (params) => api.get('/chat/messages', { params }).then((r) => r.data.data),
  sendMessage: (payload) => api.post('/chat/messages', payload).then((r) => r.data.data),
  markRead: (id) => api.patch(`/chat/messages/${id}/read`).then((r) => r.data.data),
  getRooms: () => api.get('/chat/rooms').then((r) => r.data.data),
  getRoomMembers: (roomId) => api.get(`/chat/rooms/${roomId}/members`).then((r) => r.data.data),
};

// ── Search API ──
export const searchApi = {
  global: (query) => api.get('/search', { params: { q: query, _t: Date.now() } }).then((r) => r.data.data),
};

// ── Activity API ──
export const activityApi = {
  feed: () => api.get('/activity').then((r) => r.data.data),
};

