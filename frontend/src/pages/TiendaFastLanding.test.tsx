import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import TiendaFastLanding from './TiendaFastLanding';

describe('TiendaFastLanding', () => {
  it('muestra el CTA de cotización con el WhatsApp comercial', () => {
    render(<TiendaFastLanding />);

    const links = screen.getAllByRole('link', { name: /solicitar cotización/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', expect.stringContaining('wa.me/584124742535'));
  });

  it('no publica testimonios inventados y muestra el programa piloto', () => {
    render(<TiendaFastLanding />);

    expect(screen.getAllByText(/programa piloto/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/María González|Carlos Pérez/)).not.toBeInTheDocument();
  });

  it('incluye acceso para clientes existentes', () => {
    render(<TiendaFastLanding />);

    const links = screen.getAllByRole('link', { name: /ya soy cliente/i });
    expect(links[0]).toHaveAttribute('href', '/admin-login');
  });
});
