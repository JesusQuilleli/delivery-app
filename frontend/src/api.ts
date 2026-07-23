import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true, // El navegador envía/recibe la cookie auth_token automáticamente
});

export default api;
