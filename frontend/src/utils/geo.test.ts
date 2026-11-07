import { describe, expect, it } from 'vitest';
import { haversineKm } from './geo';

describe('haversineKm', () => {
  it('devuelve 0 para el mismo punto', () => {
    expect(haversineKm(5.6667, -67.6333, 5.6667, -67.6333)).toBe(0);
  });

  it('calcula una distancia aproximada de 1 km', () => {
    const km = haversineKm(5.6667, -67.6333, 5.6757, -67.6333);
    expect(km).toBeGreaterThan(0.99);
    expect(km).toBeLessThan(1.01);
  });

  it('devuelve Infinity cuando faltan coordenadas válidas', () => {
    expect(haversineKm(Number.NaN, -67.6333, 5.6667, -67.6333)).toBe(Number.POSITIVE_INFINITY);
  });
});
