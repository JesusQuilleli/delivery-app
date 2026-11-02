const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { req, clientToken, prisma } = require('./helpers');

let user = null;
let token = null;
let product = null;
let component = null;
let combo = null;
const orderIds = [];

before(async () => {
  user = await prisma.user.create({
    data: {
      email: `stock-${Date.now()}@example.com`,
      name: 'Stock Test',
      phone: `04${String(Date.now()).slice(0, 9)}`,
      store_id: 1,
      role: 'CLIENT'
    }
  });
  token = clientToken(user.id);

  product = await prisma.product.create({
    data: {
      store_id: 1,
      name: `Stock Product ${Date.now()}`,
      price: 10,
      stock: 5,
      is_available: true
    }
  });

  component = await prisma.product.create({
    data: {
      store_id: 1,
      name: `Stock Component ${Date.now()}`,
      price: 2,
      stock: 5,
      is_available: true
    }
  });

  combo = await prisma.product.create({
    data: {
      store_id: 1,
      name: `Stock Combo ${Date.now()}`,
      price: 15,
      stock: null,
      is_combo: true,
      is_available: true,
      comboItems: {
        create: [{ product_id: component.id, quantity: 2 }]
      }
    }
  });
});

after(async () => {
  for (const id of orderIds) {
    await prisma.orderItem.deleteMany({ where: { order_id: id } });
    await prisma.order.delete({ where: { id } }).catch(() => {});
  }
  if (combo) {
    await prisma.comboItem.deleteMany({ where: { combo_id: combo.id } });
    await prisma.product.delete({ where: { id: combo.id } }).catch(() => {});
  }
  if (component) await prisma.product.delete({ where: { id: component.id } }).catch(() => {});
  if (product) await prisma.product.delete({ where: { id: product.id } }).catch(() => {});
  if (user) await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
});

async function place(productId, quantity) {
  return req('POST', '/orders/place', {
    token,
    body: {
      store_id: 1,
      items: [{ product_id: productId, quantity }],
      delivery_address: 'Av. Stock 123',
      payment_method: 'CASH'
    }
  });
}

test('stock: rechaza un pedido mayor al stock disponible', async () => {
  const res = await place(product.id, 6);
  assert.equal(res.status, 400, JSON.stringify(res.json));

  const current = await prisma.product.findUnique({ where: { id: product.id } });
  assert.equal(current.stock, 5);
});

test('stock: descuenta el stock al crear el pedido', async () => {
  const res = await place(product.id, 2);
  assert.equal(res.status, 200, JSON.stringify(res.json));
  orderIds.push(res.json.order_id);

  const current = await prisma.product.findUnique({ where: { id: product.id } });
  assert.equal(current.stock, 3);
});

test('stock: rechaza combos si sus componentes no alcanzan', async () => {
  const res = await place(combo.id, 3);
  assert.equal(res.status, 400, JSON.stringify(res.json));

  const current = await prisma.product.findUnique({ where: { id: component.id } });
  assert.equal(current.stock, 5);
});

test('stock: descuenta componentes al vender un combo', async () => {
  const res = await place(combo.id, 2);
  assert.equal(res.status, 200, JSON.stringify(res.json));
  orderIds.push(res.json.order_id);

  const current = await prisma.product.findUnique({ where: { id: component.id } });
  assert.equal(current.stock, 1);
});

test('stock: rechaza el siguiente combo si ya no alcanzan los componentes', async () => {
  const res = await place(combo.id, 1);
  assert.equal(res.status, 400, JSON.stringify(res.json));

  const current = await prisma.product.findUnique({ where: { id: component.id } });
  assert.equal(current.stock, 1);
});
