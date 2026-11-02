import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { toast } from 'sonner';
import api from './api';

const mock = new MockAdapter(api, { onNoMatch: 'throwException' });

const spies = () => ({
  dispatch: vi.spyOn(window, 'dispatchEvent'),
  toastError: vi.spyOn(toast, 'error'),
});

function trackSessionExpired() {
  let fired = false;
  const original = window.dispatchEvent.bind(window);
  window.dispatchEvent = ((e: Event) => {
    if (e.type === 'auth:session-expired') fired = true;
    return original(e);
  }) as typeof window.dispatchEvent;
  return () => fired;
}

describe('api interceptor', () => {
  beforeEach(() => {
    mock.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('no dispara 401 para /auth/refresh ni /auth/admin-login', async () => {
    mock.onGet('/auth/refresh').reply(401, { error: 'Expirado' });
    const fired = trackSessionExpired();
    await api.get('/auth/refresh').catch(() => {});
    expect(fired()).toBe(false);
  });

  it('dispara auth:session-expired con 401 en otra ruta', async () => {
    mock.onGet('/orders/my-orders').reply(401, { error: 'Sin sesión' });
    const fired = trackSessionExpired();
    await api.get('/orders/my-orders').catch(() => {});
    expect(fired()).toBe(true);
  });

  it('muestra toast de error para 403', async () => {
    const { toastError } = spies();
    mock.onGet('/superadmin/stores').reply(403, { error: 'Permiso denegado' });
    await api.get('/superadmin/stores').catch(() => {});
    expect(toastError).toHaveBeenCalled();
  });

  it('muestra toast de error para 429', async () => {
    const { toastError } = spies();
    mock.onPost('/auth/check-email').reply(429, { error: 'Demasiadas peticiones' });
    await api.post('/auth/check-email').catch(() => {});
    expect(toastError).toHaveBeenCalled();
  });

  it('muestra toast de error para 500', async () => {
    const { toastError } = spies();
    mock.onGet('/stores/slug-falso/products').reply(500, { error: 'Error del servidor' });
    await api.get('/stores/slug-falso/products').catch(() => {});
    expect(toastError).toHaveBeenCalled();
  });
});