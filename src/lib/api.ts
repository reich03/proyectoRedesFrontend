import axios from 'axios';

const BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({ baseURL: BASE });

export const usersApi = {
  getAll: () => api.get('/users').then(r => r.data),
  getOne: (id: string) => api.get(`/users/${id}`).then(r => r.data),
  create: (data: any) => api.post('/users', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/users/${id}`).then(r => r.data),
};

export const projectsApi = {
  getAll: () => api.get('/projects').then(r => r.data),
  getOne: (id: string) => api.get(`/projects/${id}`).then(r => r.data),
  create: (data: any) => api.post('/projects', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/projects/${id}`).then(r => r.data),
  getMembers: (id: string) => api.get(`/projects/${id}/members`).then(r => r.data),
  addMember: (id: string, data: any) => api.post(`/projects/${id}/members`, data).then(r => r.data),
  removeMember: (id: string, userId: string) => api.delete(`/projects/${id}/members/${userId}`).then(r => r.data),
  getStats: (id: string) => api.get(`/projects/${id}/stats`).then(r => r.data),
};

export const sprintsApi = {
  getByProject: (projectId: string) => api.get(`/sprints?projectId=${projectId}`).then(r => r.data),
  getOne: (id: string) => api.get(`/sprints/${id}`).then(r => r.data),
  create: (data: any) => api.post('/sprints', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/sprints/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/sprints/${id}`).then(r => r.data),
  getTimeline: (id: string) => api.get(`/sprints/${id}/timeline`).then(r => r.data),
};

export const tasksApi = {
  getBySprint: (sprintId: string) => api.get(`/tasks?sprintId=${sprintId}`).then(r => r.data),
  create: (data: any) => api.post('/tasks', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data).then(r => r.data),
  reorder: (updates: any[]) => api.put('/tasks/reorder', updates).then(r => r.data),
  delete: (id: string) => api.delete(`/tasks/${id}`).then(r => r.data),
};

export const credentialsApi = {
  getByProject: (projectId: string) => api.get(`/credentials?projectId=${projectId}`).then(r => r.data),
  create: (data: any) => api.post('/credentials', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/credentials/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/credentials/${id}`).then(r => r.data),
};

export const docsApi = {
  getByProject: (projectId: string) => api.get(`/docs?projectId=${projectId}`).then(r => r.data),
  getOne: (id: string) => api.get(`/docs/${id}`).then(r => r.data),
  create: (data: any) => api.post('/docs', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/docs/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/docs/${id}`).then(r => r.data),
};

export const auditApi = {
  getByProject: (projectId: string) => api.get(`/audit?projectId=${projectId}`).then(r => r.data),
  getAll: () => api.get('/audit').then(r => r.data),
};
