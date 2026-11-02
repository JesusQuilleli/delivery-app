import { describe, it, expect } from 'vitest';
import { formatPrice, getConversions } from './currency';

describe('formatPrice', () => {
  it('formatea USD', () => {
    expect(formatPrice(12.5, 'USD')).toBe('$12.50');
  });
  it('formatea USDT indistinto a USD', () => {
    expect(formatPrice(1, 'USDT')).toBe('$1.00');
  });
  it('formatea VES con separador de miles', () => {
    expect(formatPrice(1000.5, 'VES')).toBe('Bs. 1.000,50');
  });
  it('formatea COP', () => {
    expect(formatPrice(4000, 'COP')).toBe('$4.000 COP');
  });
  it('default a USD sin currency', () => {
    expect(formatPrice(7.99)).toBe('$7.99');
  });
});

describe('getConversions', () => {
  const store = {
    currency: 'USD',
    usd_rate: 1,
    ves_rate: 36.5,
    cop_rate: 4000,
  };
  it('convierte desde USD a VES y COP', () => {
    const conv = getConversions(10, store)!;
    expect(conv).toEqual({
      VES: 'Bs. 365,00',
      COP: '$40.000 COP',
    });
  });
  it('con base VES no incluye VES', () => {
    const conv = getConversions(36.5, { ...store, currency: 'VES' })!;
    expect(conv.VES).toBeUndefined();
    expect(conv.USD).toBe('$36.50');
  });
  it('sin store devuelve null', () => {
    expect(getConversions(10, undefined)).toBeNull();
  });
  it('usa rates por defecto si faltan', () => {
    const conv = getConversions(1, { currency: 'USD' })!;
    expect(conv.VES).toBe('Bs. 36,50');
  });
});