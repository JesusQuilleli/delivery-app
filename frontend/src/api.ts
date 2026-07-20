import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.1.53:3000/api',
});

// Interceptor para agregar el token JWT a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('client_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
