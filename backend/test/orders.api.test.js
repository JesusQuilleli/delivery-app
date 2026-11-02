const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { req, adminToken, superadminToken, clientToken, prisma } = require('./helpers');

const admin = adminToken();
const superadmin = superadminToken();
const adminOtherStore = adminToken(7777);

let clientUser = null;
let client = null;
let testOrderIds = [];
let product = null;

before(async () => {
  product = await prisma.product.create({
    data: {
      store_id: 1,
      name: `Test Order Product ${Date.now()}`,
      price: 10.25,
      stock: 100000,
      is_available: true
    }
  });
  clientUser = await prisma.user.create({
    data: {
      email: `order-${Date.now()}@example.com`,
      name: 'Test Order',
      phone: `05${String(Date.now()).slice(0, 9)}`,
      store_id: 1,
      role: 'CLIENT'
    }
  });
  client = clientToken(clientUser.id);
});

after(async () => {
  for (const id of testOrderIds) {
    await prisma.orderItem.deleteMany({ where: { order_id: id } });
    await prisma.order.delete({ where: { id } }).catch(() => {});
  }
  if (clientUser) await prisma.user.delete({ where: { id: clientUser.id } }).catch(() => {});
  if (product) await prisma.product.delete({ where: { id: product.id } }).catch(() => {});
});

async function placeOrder(extra = {}) {
  return req('POST', '/orders/place', {
    token: client,
    body: {
      store_id: 1,
      items: [{ product_id: product.id, quantity: 2 }],
      delivery_address: 'Av. Principal 123, Torre A',
      payment_method: 'CASH',
      ...extra
    }
  });
}

test('orders: placeOrder crea pedido PENDING con precio del servidor', async () => {
  const res = await placeOrder();
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.ok(res.json.order_id);
  const order = await prisma.order.findUnique({ where: { id: res.json.order_id } });
  assert.equal(order.status, 'PENDING');
  assert.equal(order.total_amount, product.price * 2);
  testOrderIds.push(res.json.order_id);
});

test('orders: TRANSFER sin referencia da 400', async () => {
  const res = await placeOrder({ payment_method: 'TRANSFER' });
  assert.equal(res.status, 400, JSON.stringify(res.json));
});

test('orders: TRANSFER con referencia queda AWAITING_PAYMENT', async () => {
  const res = await placeOrder({ payment_method: 'TRANSFER', payment_reference: 'REF123' });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  const order = await prisma.order.findUnique({ where: { id: res.json.order_id } });
  assert.equal(order.status, 'AWAITING_PAYMENT');
  testOrderIds.push(res.json.order_id);
});

test('orders: producto de otra tienda da 400', async () => {
  const res = await req('POST', '/orders/place', {
    token: client,
    body: {
      store_id: 1,
      items: [{ product_id: 999999999, quantity: 1 }],
      delivery_address: 'Av. Principal 123',
      payment_method: 'CASH'
    }
  });
  assert.equal(res.status, 400, JSON.stringify(res.json));
});

test('orders: sin auth da 401', async () => {
  const res = await req('POST', '/orders/place', {
    body: { store_id: 1, items: [], delivery_address: 'x' }
  });
  assert.equal(res.status, 401);
});

test('orders: getMyOrders del cliente incluye el pedido', async () => {
  const res = await placeOrder();
  const orderId = res.json.order_id;
  testOrderIds.push(orderId);
  const list = await req('GET', '/orders/my-orders', { token: client });
  assert.equal(list.status, 200);
  assert.ok(list.json.some(o => o.id === orderId));
});

test('orders: transición válida PENDING->ACCEPTED', async () => {
  const res = await placeOrder();
  const orderId = res.json.order_id;
  testOrderIds.push(orderId);
  const upd = await req('PUT', `/orders/${orderId}/status`, { token: admin, body: { status: 'ACCEPTED' } });
  assert.equal(upd.status, 200, JSON.stringify(upd.json));
});

test('orders: transición inválida PENDING->DELIVERED da 409', async () => {
  const res = await placeOrder();
  const orderId = res.json.order_id;
  testOrderIds.push(orderId);
  const upd = await req('PUT', `/orders/${orderId}/status`, { token: admin, body: { status: 'DELIVERED' } });
  assert.equal(upd.status, 409, JSON.stringify(upd.json));
});

test('orders: admin con otra tienda no puede ver pedido (403)', async () => {
  const res = await placeOrder();
  const orderId = res.json.order_id;
  testOrderIds.push(orderId);
  const get = await req('GET', `/orders/${orderId}`, { token: adminOtherStore });
  assert.equal(get.status, 403, JSON.stringify(get.json));
});

test('orders: rate sobre pedido no entregado debe rechazarse (BUG?)', async () => {
  const res = await placeOrder();
  const orderId = res.json.order_id;
  testOrderIds.push(orderId);
  const rate = await req('PUT', `/orders/${orderId}/rate`, { token: client, body: { rating: 5, review: 'ok' } });
  const orderAfter = await prisma.order.findUnique({ where: { id: orderId } });
  const noBug = rate.status >= 400 && orderAfter.status !== 'DELIVERED';
  assert.equal(noBug, true, `BUG: rate sobre PENDING aceptado (${rate.status}) y orden movida a ${orderAfter.status}`);
});

test('orders: cliente no puede cancelar pedido aceptado', async () => {
  const res = await placeOrder();
  const orderId = res.json.order_id;
  testOrderIds.push(orderId);
  await req('PUT', `/orders/${orderId}/status`, { token: admin, body: { status: 'ACCEPTED' } });
  const cancel = await req('PUT', `/orders/${orderId}/cancel`, { token: client, body: { cancel_reason: 'x' } });
  assert.equal(cancel.status, 400, JSON.stringify(cancel.json));
});

test('orders: cliente cancela pedido PENDING', async () => {
  const res = await placeOrder();
  const orderId = res.json.order_id;
  testOrderIds.push(orderId);
  const cancel = await req('PUT', `/orders/${orderId}/cancel`, { token: client, body: { cancel_reason: 'me arrepentí' } });
  assert.equal(cancel.status, 200, JSON.stringify(cancel.json));
  assert.equal(cancel.json.order.status, 'CANCELLED');
});

test('orders: batch-status actualiza varios', async () => {
  const o1 = await placeOrder();
  const o2 = await placeOrder();
  testOrderIds.push(o1.json.order_id, o2.json.order_id);
  const b = await req('PUT', '/orders/batch-status', {
    token: admin,
    body: { order_ids: [o1.json.order_id, o2.json.order_id], status: 'ACCEPTED' }
  });
  assert.equal(b.status, 200, JSON.stringify(b.json));
  assert.equal(b.json.updated, 2);
});

test('orders: batch-status debe validar transiciones (BUG?)', async () => {
  const res = await placeOrder();
  const orderId = res.json.order_id;
  testOrderIds.push(orderId);
  const b = await req('PUT', '/orders/batch-status', {
    token: admin,
    body: { order_ids: [orderId], status: 'DELIVERED' }
  });
  const noBug = b.status !== 200;
  assert.equal(noBug, true, `BUG: batch-status saltó PENDING->DELIVERED (${b.status})`);
});

test('orders: getOrderById de admin', async () => {
  const res = await placeOrder();
  const orderId = res.json.order_id;
  testOrderIds.push(orderId);
  const get = await req('GET', `/orders/${orderId}`, { token: admin });
  assert.equal(get.status, 200, JSON.stringify(get.json));
  assert.ok(get.json.items.length > 0);
});

test('orders: markOrderViewed con id inexistente debe dar 404 (BUG?)', async () => {
  const res = await req('PUT', '/orders/999999999/viewed', { token: admin });
  assert.equal(res.status, 404, `BUG: markOrderViewed con id inexistente devolvió ${res.status} (esperado 404)`);
});

test('orders: deleteOrder de admin', async () => {
  const res = await placeOrder();
  const orderId = res.json.order_id;
  const del = await req('DELETE', `/orders/${orderId}`, { token: admin });
  assert.equal(del.status, 200, JSON.stringify(del.json));
  const gone = await prisma.order.findUnique({ where: { id: orderId } });
  assert.equal(gone, null);
  testOrderIds.push(orderId);
});