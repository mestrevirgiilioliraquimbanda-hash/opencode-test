import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const leadsAPI = {
  getAll: () => api.get('/leads'),
  getById: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.patch(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
};

export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
};

export const tenantsAPI = {
  getProfile: () => api.get('/tenants/profile'),
};

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
};

export default api;
