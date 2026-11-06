const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getPlan, PLANS, DEFAULT_PLAN } = require('../config/plans');

test('plans: getPlan retorna plan por defecto ante código nulo o vacío', () => {
  const p1 = getPlan(null);
  const p2 = getPlan('');
  const p3 = getPlan('INEXISTENTE');
  assert.equal(p1.code, DEFAULT_PLAN);
  assert.equal(p2.code, DEFAULT_PLAN);
  assert.equal(p3.code, DEFAULT_PLAN);
});

test('plans: reconoce planes en mayúsculas y minúsculas', () => {
  const pNegocio = getPlan('negocio');
  assert.equal(pNegocio.code, 'NEGOCIO');
  assert.equal(pNegocio.priceUSD, 30);
  assert.equal(pNegocio.maxProducts, 250);

  const pPro = getPlan('PRO');
  assert.equal(pPro.code, 'PRO');
  assert.equal(pPro.priceUSD, 50);
  assert.equal(pPro.maxProducts, 1000);
});

test('plans: los límites comerciales respetan la escala SaaS', () => {
  assert.ok(PLANS.EMPRENDEDOR.maxProducts < PLANS.NEGOCIO.maxProducts);
  assert.ok(PLANS.NEGOCIO.maxProducts < PLANS.PRO.maxProducts);
  assert.ok(PLANS.EMPRENDEDOR.priceUSD < PLANS.NEGOCIO.priceUSD);
  assert.ok(PLANS.NEGOCIO.priceUSD < PLANS.PRO.priceUSD);
});
