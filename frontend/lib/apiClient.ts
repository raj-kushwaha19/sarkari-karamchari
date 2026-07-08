import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor: don't expose internals
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.error || 'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
