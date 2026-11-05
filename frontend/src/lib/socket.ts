import { io } from 'socket.io-client';

export function getSocketURL(): string {
  return import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
}

// Crea un socket con reconexión automática (backoff exponencial) para que un
// connect_error puntual no deje al cliente "mudo" permanentemente.
// No se debe sobrescribir `path`: Socket.io usa `/socket.io/` por defecto.
export function createSocket() {
  return io(getSocketURL(), {
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  });
}
