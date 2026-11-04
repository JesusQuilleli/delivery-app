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
  it('formatea COP sin decimales', () => {
    expect(formatPrice(4000, 'COP')).toBe('$4.000 COP');
    expect(formatPrice(4000.7, 'COP')).toBe('$4.001 COP');
  });
  it('acepta valores decimales serializados como texto', () => {
    expect(formatPrice('12.50' as unknown as number, 'USD')).toBe('$12.50');
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
  it('con base VES convierte a USD y COP usando el pivote USD', () => {
    const conv = getConversions(36.5, { ...store, currency: 'VES' })!;
    expect(conv.VES).toBeUndefined();
    expect(conv.USD).toBe('$1.00');
    expect(conv.COP).toBe('$4.000 COP');
  });
  it('con base COP convierte a USD y VES usando el pivote USD', () => {
    const conv = getConversions(4000, { ...store, currency: 'COP' })!;
    expect(conv.COP).toBeUndefined();
    expect(conv.USD).toBe('$1.00');
    expect(conv.VES).toBe('Bs. 36,50');
  });
  it('sin store devuelve null', () => {
    expect(getConversions(10, undefined)).toBeNull();
  });
  it('usa rates por defecto si faltan', () => {
    const conv = getConversions(1, { currency: 'USD' })!;
    expect(conv.VES).toBe('Bs. 36,50');
  });
});
