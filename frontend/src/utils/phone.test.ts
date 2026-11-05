import { describe, expect, it } from 'vitest';
import { normalizePhone, parsePhone } from './phone';

describe('phone', () => {
  it('separa un teléfono venezolano con signo +', () => {
    expect(parsePhone('+584121234567')).toMatchObject({
      countryCode: '+58',
      nationalNumber: '4121234567',
      e164: '+584121234567',
      isValid: true,
    });
  });

  it('separa un teléfono venezolano con 0 inicial y separadores', () => {
    expect(parsePhone('0412-123-4567')).toMatchObject({
      countryCode: '+58',
      nationalNumber: '4121234567',
      e164: '+584121234567',
      isValid: true,
    });
  });

  it('separa un teléfono venezolano con espacios', () => {
    expect(parsePhone('+58 412 123 4567')).toMatchObject({
      countryCode: '+58',
      nationalNumber: '4121234567',
      e164: '+584121234567',
      isValid: true,
    });
  });

  it('separa Colombia sin signo +', () => {
    expect(parsePhone('+57 300 123 4567')).toMatchObject({
      countryCode: '+57',
      nationalNumber: '3001234567',
      e164: '+573001234567',
      isValid: true,
    });
  });

  it('separa Ecuador con 0 inicial', () => {
    expect(parsePhone('+593 099 123 4567')).toMatchObject({
      countryCode: '+593',
      nationalNumber: '991234567',
      e164: '+593991234567',
      isValid: true,
    });
  });

  it('separa Estados Unidos', () => {
    expect(parsePhone('+1 809 555 1234')).toMatchObject({
      countryCode: '+1',
      nationalNumber: '8095551234',
      e164: '+18095551234',
      isValid: true,
    });
  });

  it('acepta prefijo internacional 00', () => {
    expect(normalizePhone('0058 412 1234567')).toBe('+584121234567');
  });

  it('rechaza números demasiado cortos', () => {
    expect(parsePhone('123')).toMatchObject({ isValid: false });
    expect(normalizePhone('123')).toBeNull();
  });

  it('rechaza un venezolano incompleto', () => {
    expect(parsePhone('+58 412 123')).toMatchObject({ isValid: false });
  });
});
