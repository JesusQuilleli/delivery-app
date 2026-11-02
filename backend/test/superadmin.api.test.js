const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { req, superadminToken, adminToken, prisma } = require('./helpers');

const superadmin = superadminToken();
const admin = adminToken(1);

let createdStoreId = null;

after(async () => {
  if (createdStoreId) {
    await prisma.user.deleteMany({ where: { store_id: createdStoreId } });
    await prisma.store.delete({ where: { id: createdStoreId } }).catch(() => {});
  }
});

test('superadmin: listar tiendas con SUPERADMIN', async () => {
  const res = await req('GET', '/superadmin/stores', { token: superadmin });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.ok(res.json.length >= 1);
  assert.ok(res.json[0].users !== undefined);
});

test('superadmin: listar tiendas con ADMIN da 403', async () => {
  const res = await req('GET', '/superadmin/stores', { token: admin });
  assert.equal(res.status, 403, JSON.stringify(res.json));
});

test('superadmin: listar tiendas sin token da 401', async () => {
  const res = await req('GET', '/superadmin/stores');
  assert.equal(res.status, 401);
});

test('superadmin: crear tienda con admin', async () => {
  const ts = Date.now();
  const res = await req('POST', '/superadmin/stores', {
    token: superadmin,
    body: {
      storeName: `Test Store ${ts}`,
      slug: `test-store-${ts}`,
      adminUsername: `super_test_${ts}`,
      adminPassword: 'secret123',
      adminPhone: `04${String(ts).slice(0, 9)}`,
      industry: 'PHARMACY'
    }
  });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  createdStoreId = res.json.data.store.id;
  assert.equal(res.json.data.admin.role, 'ADMIN');
  assert.equal(res.json.data.store.slug, `test-store-${ts}`);
});

test('superadmin: crear tienda con slug inválido da 400', async () => {
  const res = await req('POST', '/superadmin/stores', {
    token: superadmin,
    body: {
      storeName: 'X',
      slug: 'SLUG CON ESPACIOS',
      adminUsername: 'u1',
      adminPassword: 'secret123',
      adminPhone: `0412-888${Date.now().toString().slice(0, 3)}`
    }
  });
  assert.equal(res.status, 400, JSON.stringify(res.json));
});

test('superadmin: crear tienda con slug duplicado da 400', async () => {
  const res = await req('POST', '/superadmin/stores', {
    token: superadmin,
    body: {
      storeName: 'X',
      slug: 'demo-farmacia',
      adminUsername: 'u_dup',
      adminPassword: 'secret123',
      adminPhone: `0412-999${Date.now().toString().slice(0, 3)}`
    }
  });
  assert.equal(res.status, 400, JSON.stringify(res.json));
});

test('superadmin: crear tienda con contraseña corta da 400', async () => {
  const res = await req('POST', '/superadmin/stores', {
    token: superadmin,
    body: {
      storeName: 'X',
      slug: `short-${Date.now()}`,
      adminUsername: 'u_short',
      adminPassword: 'abc',
      adminPhone: `0412-777${Date.now().toString().slice(0, 3)}`
    }
  });
  assert.equal(res.status, 400, JSON.stringify(res.json));
});

test('superadmin: toggle estado de tienda', async () => {
  const stores = await req('GET', '/superadmin/stores', { token: superadmin });
  const target = stores.json.find(s => s.slug === 'demo-farmacia');
  const before = target.is_active;
  const res = await req('PUT', `/superadmin/stores/${target.id}/status`, { token: superadmin });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.equal(res.json.is_active, !before);
  await req('PUT', `/superadmin/stores/${target.id}/status`, { token: superadmin });
});