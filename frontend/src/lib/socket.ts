import { io } from 'socket.io-client';

export function getSocketURL(): string {
  return import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
}

// Crea un socket con reconexión automática (backoff exponencial) para que un
// connect_error puntual no deje al cliente "mudo" permanentemente.
export function createSocket(path: string = '/') {
  return io(getSocketURL(), {
    path,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  });
}
