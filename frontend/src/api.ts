import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.error;
    const url = error.config?.url || '';

    if (status === 401) {
      // No redirigir desde aquí: la redirección la decide cada contexto (cliente vs admin).
      // Simplemente anunciamos que la sesión no es válida para que AuthContext limpie el estado.
      if (!url.includes('/auth/refresh') && !url.includes('/auth/admin-login')) {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }
    } else if (status === 403) {
      toast.error(message || 'No tienes permisos para esta acción.');
    } else if (status === 429) {
      toast.error(message || 'Demasiadas peticiones. Espera un momento.');
    } else if (status >= 500) {
      toast.error(message || 'Error del servidor. Intenta de nuevo.');
    }

    return Promise.reject(error);
  }
);

export default api;
