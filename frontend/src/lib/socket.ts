import { io } from 'socket.io-client';

export function getSocketURL(): string {
  return import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
}

// Crea un socket con reconexión automática (backoff exponencial) e inyección
// de token de autorización en el handshake para soportar entornos cross-site (Netlify ↔ Render).
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
