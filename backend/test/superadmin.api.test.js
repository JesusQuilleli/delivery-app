const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { req, superadminToken, adminToken, clientToken, prisma } = require('./helpers');

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

test('superadmin: toggle estado de tienda y registra auditoría', async () => {
  const stores = await req('GET', '/superadmin/stores', { token: superadmin });
  const target = stores.json.find(s => s.slug === 'demo-farmacia');
  const before = target.is_active;

  // Desactivar con razón
  const res = await req('PUT', `/superadmin/stores/${target.id}/status`, {
    token: superadmin,
    body: { reason: 'Mantenimiento de prueba' }
  });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.equal(res.json.is_active, !before);
  assert.ok(res.json.audit, 'Debe incluir registro de auditoría');
  assert.equal(res.json.audit.store_id, target.id);
  assert.equal(res.json.audit.new_status, !before);
  assert.equal(res.json.audit.reason, 'Mantenimiento de prueba');
  assert.ok(res.json.audit.timestamp);

  // Si quedó inactiva, verificar que el catálogo público responde 404 y pedidos responden 400
  if (res.json.is_active === false) {
    const catalogRes = await req('GET', `/stores/${target.slug}/products`);
    assert.equal(catalogRes.status, 404, 'Catálogo de tienda inactiva debe ser 404');

    const orderRes = await req('POST', '/orders/place', {
      token: clientToken(999, target.id),
      body: {
        store_id: target.id,
        items: [{ product_id: 1, quantity: 1, unit_price: 1.0 }],
        delivery_address: 'Av Principal #1',
        payment_method: 'CASH',
        total_amount: 1.0
      }
    });
    assert.equal(orderRes.status, 400, 'Creación de pedido en tienda inactiva debe ser 400');
    assert.match(orderRes.json.error, /inactiva|no disponible/i);
  }

  // Restaurar al estado original
  const restoreRes = await req('PUT', `/superadmin/stores/${target.id}/status`, { token: superadmin });
  assert.equal(restoreRes.status, 200);
  assert.equal(restoreRes.json.is_active, before);
});

test('superadmin: listar suscripciones SaaS y métricas MRR (F2B-03, F2B-09)', async () => {
  const res = await req('GET', '/superadmin/subscriptions', { token: superadmin });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.ok(res.json.summary, 'Debe incluir resumen de métricas');
  assert.equal(typeof res.json.summary.mrr, 'number');
  assert.ok(Array.isArray(res.json.stores));
  assert.ok(res.json.stores.length >= 1);
  assert.ok(res.json.stores[0].plan !== undefined);
  assert.ok(res.json.stores[0].product_usage !== undefined);
});

test('superadmin: actualizar plan y estado de suscripción con auditoría (F2B-04, F2B-10)', async () => {
  const stores = await req('GET', '/superadmin/stores', { token: superadmin });
  const target = stores.json.find(s => s.slug === 'demo-farmacia');

  const res = await req('PUT', `/superadmin/stores/${target.id}/subscription`, {
    token: superadmin,
    body: {
      plan: 'NEGOCIO',
      plan_price: 30,
      subscription_status: 'ACTIVE',
      reason: 'Upgrade comercial negociado'
    }
  });

  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.equal(res.json.store.plan, 'NEGOCIO');
  assert.equal(res.json.store.subscription_status, 'ACTIVE');
  assert.ok(res.json.audit);
  assert.equal(res.json.audit.action, 'SUBSCRIPTION_UPDATED');
  assert.equal(res.json.audit.new_plan, 'NEGOCIO');
});

test('superadmin: registrar pago de suscripción y consultar historial (F2B-02, F2B-08)', async () => {
  const stores = await req('GET', '/superadmin/stores', { token: superadmin });
  const target = stores.json.find(s => s.slug === 'demo-farmacia');

  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const payRes = await req('POST', `/superadmin/stores/${target.id}/payments`, {
    token: superadmin,
    body: {
      amount: 30.0,
      currency: 'USD',
      payment_method: 'PAGO_MOVIL',
      payment_reference: 'TEST-RECIBO-998877',
      period_start: now.toISOString(),
      period_end: nextMonth.toISOString(),
      notes: 'Mensualidad Plan Negocio'
    }
  });

  assert.equal(payRes.status, 200, JSON.stringify(payRes.json));
  assert.equal(payRes.json.payment.payment_reference, 'TEST-RECIBO-998877');
  assert.equal(payRes.json.store.subscription_status, 'ACTIVE');

  // Consultar historial de pagos
  const historyRes = await req('GET', `/superadmin/stores/${target.id}/payments`, { token: superadmin });
  assert.equal(historyRes.status, 200);
  assert.ok(Array.isArray(historyRes.json));
  assert.ok(historyRes.json.some(p => p.payment_reference === 'TEST-RECIBO-998877'));
});