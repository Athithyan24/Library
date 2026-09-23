import axios from 'axios';
import { useAuth } from '../store/useAuth';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'The desk could not complete that.';
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      useAuth.getState().logout();
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(new Error(message));
  }
);
