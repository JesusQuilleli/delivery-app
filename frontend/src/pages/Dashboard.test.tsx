import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import api from '../api';
import Dashboard from './Dashboard';

vi.mock('../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
  })),
}));

const mockGet = api.get as ReturnType<typeof vi.fn>;

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={['/admin/demo-farmacia']}>
    <Routes>
      <Route path="/admin/:slug" element={children} />
    </Routes>
  </MemoryRouter>
);

describe('Dashboard (smoke)', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockImplementation((url: string) => {
      if (String(url).includes('/orders')) {
        return Promise.resolve({ data: { storeId: 1, orders: [] } });
      }
      if (String(url).includes('/products')) {
        return Promise.resolve({ data: { store: { slug: 'demo-farmacia', currency: 'USD', name: 'Demo' } } });
      }
      if (String(url).includes('/drivers')) {
        return Promise.resolve({ data: { drivers: [] } });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('renderiza sin crash y muestra el panel de despachos', async () => {
    render(<Dashboard />, { wrapper });
    expect(await screen.findByText('Panel de Despachos')).toBeInTheDocument();
  });

  it('sobrevive a errores de red sin crash', async () => {
    mockGet.mockRejectedValue({ response: { status: 500, data: { error: 'Error del servidor' } } });
    render(<Dashboard />, { wrapper });
    expect(document.body.textContent).toContain('Cargando panel de control...');
  });
});