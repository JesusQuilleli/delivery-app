import { describe, it, expect, vi } from 'vitest';
import { getSocketURL, createSocket } from './socket';

interface SocketOpts {
  withCredentials: boolean;
  reconnection: boolean;
  reconnectionDelay: number;
  reconnectionDelayMax: number;
  timeout: number;
  path?: string;
}

const mockedIo = vi.hoisted(() =>
  vi.fn<(_url: string, _opts: SocketOpts) => unknown>(() => ({ fake: true }))
);
vi.mock('socket.io-client', () => ({ io: mockedIo }));

describe('socket', () => {
  it('getSocketURL usa el default si no hay env', () => {
    const before = import.meta.env.VITE_SOCKET_URL;
    delete import.meta.env.VITE_SOCKET_URL;
    expect(getSocketURL()).toBe('http://localhost:3000');
    import.meta.env.VITE_SOCKET_URL = before;
  });

  it('getSocketURL lee el env', () => {
    import.meta.env.VITE_SOCKET_URL = 'https://api.ejemplo.com';
    expect(getSocketURL()).toBe('https://api.ejemplo.com');
  });

  it('createSocket configura reconexión automática y credenciales', () => {
    createSocket();
    const opts = mockedIo.mock.calls[0]?.[1];
    expect(opts?.withCredentials).toBe(true);
    expect(opts?.reconnection).toBe(true);
    expect(opts?.reconnectionDelay).toBe(1000);
    expect(opts?.reconnectionDelayMax).toBe(10000);
    expect(opts?.timeout).toBe(10000);
  });

  it('createSocket no sobrescribe el path por defecto de Socket.io', () => {
    createSocket();
    const opts = mockedIo.mock.calls[0]?.[1];
    expect(opts?.path).toBeUndefined();
  });

  it('createSocket retorna el socket', () => {
    const s = createSocket();
    expect(s).toEqual({ fake: true });
  });
});
