import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import api from '../api';
import { CartProvider } from '../context/CartContext';
import Catalog from './Catalog';

vi.mock('../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual };
});

const mockGet = api.get as ReturnType<typeof vi.fn>;

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={['/demo-farmacia']}>
    <CartProvider>{children}</CartProvider>
  </MemoryRouter>
);

describe('Catalog (smoke)', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('renderiza sin crash y muestra productos', async () => {
    mockGet.mockResolvedValue({
      data: {
        store: { id: 1, name: 'Demo Farmacia', slug: 'demo-farmacia', currency: 'USD' },
        categories: [],
        products: [
          { id: 1, name: 'Paracetamol 500mg', price: 2.5, image_url: 'x', is_available: true },
          { id: 2, name: 'Ibuprofeno 400mg', price: 3.0, image_url: 'x', is_available: true },
        ],
        pagination: { currentPage: 1, totalPages: 1, totalProducts: 2 },
      },
    });
    render(<Catalog />, { wrapper });
    expect(await screen.findByText('Paracetamol 500mg')).toBeInTheDocument();
    expect((await screen.findByText('Ibuprofeno 400mg'))).toBeInTheDocument();
  });
});