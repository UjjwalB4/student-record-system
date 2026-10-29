import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const getStatus   = ()            => api.get('/status');
export const getStudents = (params = {}) => api.get('/students', { params });
export const getStudent  = (id)          => api.get(`/students/${id}`);
export const addStudent  = (data)        => api.post('/students', data);
export const updateStudent = (id, data)  => api.put(`/students/${id}`, data);
export const deleteStudent = (id)        => api.delete(`/students/${id}`);
export const getStats    = ()            => api.get('/stats');

export default api;
