const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizePhone, splitPhone } = require('../utils/phone');

test('normaliza teléfono venezolano con signo +', () => {
  assert.deepEqual(splitPhone('+584121234567'), {
    countryCode: '+58',
    nationalNumber: '4121234567',
    e164: '+584121234567',
    isValid: true,
  });
});

test('normaliza teléfono venezolano con 0 inicial y separadores', () => {
  assert.equal(normalizePhone('0412-123-4567'), '+584121234567');
});

test('normaliza teléfono venezolano con espacios', () => {
  assert.equal(normalizePhone('+58 412 123 4567'), '+584121234567');
});

test('normaliza Colombia con signo +', () => {
  assert.deepEqual(splitPhone('+57 300 123 4567'), {
    countryCode: '+57',
    nationalNumber: '3001234567',
    e164: '+573001234567',
    isValid: true,
  });
});

test('normaliza Ecuador con 0 inicial', () => {
  assert.deepEqual(splitPhone('+593 099 123 4567'), {
    countryCode: '+593',
    nationalNumber: '991234567',
    e164: '+593991234567',
    isValid: true,
  });
});

test('normaliza Estados Unidos', () => {
  assert.equal(normalizePhone('+1 809 555 1234'), '+18095551234');
});

test('acepta prefijo internacional 00', () => {
  assert.equal(normalizePhone('0058 412 1234567'), '+584121234567');
});

test('rechaza números inválidos', () => {
  assert.equal(normalizePhone('123'), null);
  assert.equal(normalizePhone('+58 412 123'), null);
  assert.equal(normalizePhone(''), null);
});
