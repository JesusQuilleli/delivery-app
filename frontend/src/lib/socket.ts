import { io } from 'socket.io-client';

export function getSocketURL(): string {
  // En producción en VPS mismo origen (detrás de Caddy), usa window.location.origin
  if (typeof window !== 'undefined' && (!import.meta.env.VITE_SOCKET_URL || import.meta.env.PROD)) {
    return window.location.origin;
  }
  return import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
}

// Crea un socket con reconexión automática (backoff exponencial) e inyección
// de token de autorización en el handshake para soportar entornos cross-site (Netlify ↔ Render) y same-origin (VPS).
export function createSocket(token?: string) {
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  return io(getSocketURL(), {
    withCredentials: true,
    auth: authToken ? { token: authToken } : undefined,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  });
}
