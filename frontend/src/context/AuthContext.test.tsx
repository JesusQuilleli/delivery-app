import { useContext, type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import api from '../api';
import { AuthProvider, AuthContext } from './AuthContext';

const mock = new MockAdapter(api, { onNoMatch: 'throwException' });

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
const useAuth = () => useContext(AuthContext);

describe('AuthContext', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    mock.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('login guarda el usuario en sessionStorage', () => {
    const { result } = renderHook(useAuth, { wrapper });
    act(() => {
      result.current.login({ id: 1, name: 'Ana', role: 'CLIENT' });
    });
    expect(result.current.user).toEqual({ id: 1, name: 'Ana', role: 'CLIENT' });
    expect(result.current.token).toBe(true);
    expect(sessionStorage.getItem('user')).toContain('Ana');
  });

  it('login restaura usuario desde sessionStorage', () => {
    sessionStorage.setItem('user', JSON.stringify({ id: 7, name: 'Luis' }));
    const { result } = renderHook(useAuth, { wrapper });
    expect(result.current.user).toEqual({ id: 7, name: 'Luis' });
  });

  it('logout limpia sesión aunque la API falle', async () => {
    mock.onPost('/auth/logout').networkError();
    const { result } = renderHook(useAuth, { wrapper });
    act(() => {
      result.current.login({ id: 1, name: 'Ana' });
    });
    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBe(false);
    expect(sessionStorage.getItem('user')).toBeNull();
  });

  it('restaura la sesión desde la cookie al montar sin sessionStorage', async () => {
    mock.onPost('/auth/refresh').reply(200, {
      user: { id: 9, name: 'Cookie', role: 'CLIENT' },
    });

    const { result } = renderHook(useAuth, { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual({ id: 9, name: 'Cookie', role: 'CLIENT' });
    });
    expect(result.current.token).toBe(true);
    expect(result.current.isInitializing).toBe(false);
    expect(sessionStorage.getItem('user')).toContain('Cookie');
  });

  it('limpia la sesión si refresh devuelve 401', async () => {
    mock.onPost('/auth/refresh').reply(401, { error: 'Expirado' });
    const { result } = renderHook(useAuth, { wrapper });
    act(() => {
      result.current.login({ id: 1, name: 'Ana' });
    });
    await waitFor(
      () => {
        expect(result.current.user).toBeNull();
      },
      { timeout: 8000 }
    );
  }, 12000);

  it('conserva la sesión si el refresh falla por red', async () => {
    vi.useFakeTimers();
    sessionStorage.setItem('user', JSON.stringify({ id: 3, name: 'Red' }));
    mock.onPost('/auth/refresh').networkError();

    const { result } = renderHook(useAuth, { wrapper });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(result.current.user).toEqual({ id: 3, name: 'Red' });
    expect(result.current.token).toBe(true);
    expect(sessionStorage.getItem('user')).toContain('Red');
  });

  it('conserva la sesión si el refresh devuelve 500', async () => {
    vi.useFakeTimers();
    sessionStorage.setItem('user', JSON.stringify({ id: 4, name: 'Servidor' }));
    mock.onPost('/auth/refresh').reply(500, { error: 'Error interno' });

    const { result } = renderHook(useAuth, { wrapper });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(result.current.user).toEqual({ id: 4, name: 'Servidor' });
    expect(result.current.token).toBe(true);
    expect(sessionStorage.getItem('user')).toContain('Servidor');
  });

  it('el evento auth:session-expired limpia la sesión', () => {
    mock.onPost('/auth/refresh').reply(401, { error: 'Sin sesión' });
    const { result } = renderHook(useAuth, { wrapper });
    act(() => {
      result.current.login({ id: 1, name: 'Ana' });
    });
    act(() => {
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    });
    expect(result.current.user).toBeNull();
  });
});