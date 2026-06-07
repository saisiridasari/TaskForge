import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/password', data),
};

export const projectAPI = {
  getAll: () => API.get('/projects'),
  getOne: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post('/projects', data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  delete: (id) => API.delete(`/projects/${id}`),
  addMember: (id, data) => API.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => API.delete(`/projects/${id}/members/${userId}`),
};

export const boardAPI = {
  getByProject: (projectId) => API.get(`/boards/project/${projectId}`),
  create: (data) => API.post('/boards', data),
  update: (id, data) => API.put(`/boards/${id}`, data),
  delete: (id) => API.delete(`/boards/${id}`),
};

export const taskAPI = {
  getByProject: (projectId) => API.get(`/tasks/project/${projectId}`),
  getByBoard: (boardId) => API.get(`/tasks/board/${boardId}`),
  create: (data) => API.post('/tasks', data),
  update: (id, data) => API.put(`/tasks/${id}`, data),
  move: (id, data) => API.put(`/tasks/${id}/move`, data),
  delete: (id) => API.delete(`/tasks/${id}`),
  getStats: () => API.get('/tasks/stats'),
  addComment: (id, data) => API.post(`/tasks/${id}/comments`, data),
  deleteComment: (id, commentId) => API.delete(`/tasks/${id}/comments/${commentId}`),
};

export const notificationAPI = {
  getAll: () => API.get('/notifications'),
  markRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/read-all'),
  delete: (id) => API.delete(`/notifications/${id}`),
};

export const userAPI = {
  getAll: () => API.get('/users'),
  search: (email) => API.get(`/users/search?email=${email}`),
};

export const activityAPI = {
  getByProject: (projectId, page = 1) => API.get(`/activity/project/${projectId}?page=${page}`),
  getByTask: (taskId) => API.get(`/activity/task/${taskId}`),
  getMy: () => API.get('/activity/me'),
};

export const searchAPI = {
  search: (params) => API.get('/search', { params }),
};

export const rulesAPI = {
  getByProject: (projectId) => API.get(`/rules/project/${projectId}`),
  create: (projectId, data) => API.post(`/rules/project/${projectId}`, data),
  update: (id, data) => API.put(`/rules/${id}`, data),
  delete: (id) => API.delete(`/rules/${id}`),
};

export const uploadAPI = {
  uploadAttachment: (taskId, formData) =>
    API.post(`/upload/task/${taskId}/attachment`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteAttachment: (taskId, attachmentId) =>
    API.delete(`/upload/task/${taskId}/attachment/${attachmentId}`),
  uploadAvatar: (formData) =>
    API.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default API;
