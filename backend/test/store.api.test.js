const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { req, adminToken, prisma } = require('./helpers');

const admin = adminToken(1);
const adminOtherStore = adminToken(7777);

let tempCustomerId = null;
let tempDriverId = null;

before(async () => {
  const c = await prisma.user.create({
    data: { email: `store-${Date.now()}@example.com`, name: 'Temp Cliente', phone: `06${String(Date.now()).slice(0, 9)}`, store_id: 1, role: 'CLIENT' }
  });
  tempCustomerId = c.id;
});

after(async () => {
  if (tempCustomerId) await prisma.user.delete({ where: { id: tempCustomerId } }).catch(() => {});
  if (tempDriverId) await prisma.driver.delete({ where: { id: tempDriverId } }).catch(() => {});
});

test('store: catálogo público con 200', async () => {
  const res = await req('GET', '/stores/demo-farmacia/products');
  assert.equal(res.status, 200);
  assert.ok(res.json.products.length > 0);
  assert.equal(res.json.store.slug, 'demo-farmacia');
});

test('store: catálogo con búsqueda filtra', async () => {
  const res = await req('GET', '/stores/demo-farmacia/products?search=Vitamina&limit=5');
  assert.equal(res.status, 200);
  assert.ok(res.json.products.every(p => p.name.toLowerCase().includes('vitamina')));
});

test('store: catálogo tienda inexistente da 404', async () => {
  const res = await req('GET', '/stores/slug-no-existe/products');
  assert.equal(res.status, 404);
});

test('store: detalle de producto público', async () => {
  const first = await req('GET', '/stores/demo-farmacia/products?limit=1');
  const id = first.json.products[0].id;
  const res = await req('GET', `/stores/demo-farmacia/products/${id}`);
  assert.equal(res.status, 200);
  assert.equal(res.json.product.id, id);
  assert.ok(Array.isArray(res.json.relatedProducts));
});

test('store: analytics con 200', async () => {
  const res = await req('GET', '/stores/demo-farmacia/analytics', { token: admin });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.ok(typeof res.json.totalSales === 'number');
});

test('store: orders activas requiere admin', async () => {
  assert.equal((await req('GET', '/stores/demo-farmacia/orders')).status, 401);
  assert.equal((await req('GET', '/stores/demo-farmacia/orders', { token: adminOtherStore })).status, 403);
  const ok = await req('GET', '/stores/demo-farmacia/orders', { token: admin });
  assert.equal(ok.status, 200, JSON.stringify(ok.json));
});

test('store: history con 200', async () => {
  const res = await req('GET', '/stores/demo-farmacia/history', { token: admin });
  assert.equal(res.status, 200, JSON.stringify(res.json));
});

test('store: actualizar settings admin', async () => {
  const res = await req('PUT', '/stores/demo-farmacia/settings', {
    token: admin,
    body: { currency: 'USD', usd_rate: 1, ves_rate: 36.5, cop_rate: 4000 }
  });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.equal(res.json.store.currency, 'USD');
});

test('store: settings sin rol ADMIN da 403', async () => {
  const res = await req('PUT', '/stores/demo-farmacia/settings', {
    token: adminOtherStore,
    body: { currency: 'USD' }
  });
  assert.equal(res.status, 403, JSON.stringify(res.json));
});

test('store: listar clientes', async () => {
  const res = await req('GET', '/stores/demo-farmacia/customers', { token: admin });
  assert.equal(res.status, 200);
  assert.ok(res.json.length >= 1);
});

test('store: actualizar cliente', async () => {
  const res = await req('PUT', `/stores/demo-farmacia/customers/${tempCustomerId}`, {
    token: admin,
    body: { name: 'Nombre Actualizado', phone: `06${String(Date.now()).slice(0, 9)}` }
  });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.equal(res.json.name, 'Nombre Actualizado');
});

test('store: eliminar cliente sin pedidos', async () => {
  const c = await prisma.user.create({
    data: { email: `store-del-${Date.now()}@example.com`, name: 'A borrar', phone: `07${String(Date.now()).slice(0, 9)}`, store_id: 1, role: 'CLIENT' }
  });
  const res = await req('DELETE', `/stores/demo-farmacia/customers/${c.id}`, { token: admin });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  const gone = await prisma.user.findUnique({ where: { id: c.id } });
  assert.equal(gone, null);
});

test('store: crear y actualizar motorizado', async () => {
  const res = await req('POST', '/stores/demo-farmacia/drivers', {
    token: admin,
    body: { name: 'Motorizado Test', phone: `0412-${String(Date.now()).slice(0, 7)}`, vehicle_plate: 'AB123CD' }
  });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  const id = res.json.driver.id;
  tempDriverId = id;
  const upd = await req('PUT', `/stores/demo-farmacia/drivers/${id}`, {
    token: admin,
    body: { name: 'Motorizado Renombrado', phone: '0412-1111111', is_active: false }
  });
  assert.equal(upd.status, 200, JSON.stringify(upd.json));
  assert.equal(upd.json.driver.is_active, false);
});

test('store: listar y eliminar motorizado', async () => {
  const res = await req('POST', '/stores/demo-farmacia/drivers', {
    token: admin,
    body: { name: 'Motorizado Del', phone: `0412-${String(Date.now()).slice(0, 7)}` }
  });
  const id = res.json.driver.id;
  const list = await req('GET', '/stores/demo-farmacia/drivers', { token: admin });
  assert.ok(list.json.drivers.some(d => d.id === id));
  const del = await req('DELETE', `/stores/demo-farmacia/drivers/${id}`, { token: admin });
  assert.equal(del.status, 200, JSON.stringify(del.json));
});