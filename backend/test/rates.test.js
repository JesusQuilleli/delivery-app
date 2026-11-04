const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { getBcvRate, clearCache } = require('../services/ratesService');

const originalFetch = global.fetch;

const okResponse = (promedio) => ({
  ok: true,
  json: async () => ({ promedio })
});

afterEach(() => {
  global.fetch = originalFetch;
  clearCache();
});

test('rates: obtiene la tasa BCV y la reutiliza desde caché', async () => {
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    return okResponse(36.5);
  };

  const first = await getBcvRate();
  const second = await getBcvRate();

  assert.equal(calls, 1);
  assert.equal(first.ves_rate, 36.5);
  assert.equal(first.cached, false);
  assert.equal(second.cached, true);
});

test('rates: force ignora la caché y vuelve a consultar', async () => {
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    return okResponse(calls === 1 ? 36.5 : 40);
  };

  await getBcvRate();
  const refreshed = await getBcvRate({ force: true });

  assert.equal(calls, 2);
  assert.equal(refreshed.ves_rate, 40);
  assert.equal(refreshed.cached, false);
});

test('rates: rechaza una tasa inválida', async () => {
  global.fetch = async () => okResponse('no-es-un-numero');
  await assert.rejects(() => getBcvRate(), /Tasa BCV inválida/);
});

test('rates: rechaza una respuesta HTTP fallida', async () => {
  global.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) });
  await assert.rejects(() => getBcvRate(), /BCV respondió 503/);
});

test('rates: si falla la red devuelve la última tasa en caché marcada como stale', async () => {
  global.fetch = async () => okResponse(36.5);
  await getBcvRate();

  global.fetch = async () => {
    throw new Error('network down');
  };
  const stale = await getBcvRate({ force: true });

  assert.equal(stale.ves_rate, 36.5);
  assert.equal(stale.cached, true);
  assert.equal(stale.stale, true);
  assert.match(stale.error, /network down/);
});
