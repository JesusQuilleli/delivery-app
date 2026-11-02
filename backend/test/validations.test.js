const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkEmailSchema, verifyOtpSchema, adminLoginSchema } = require('../validations/authValidation');
const { placeOrderSchema, updateOrderStatusSchema, batchStatusSchema } = require('../validations/orderValidation');

test('AUTH: checkEmailSchema acepta email válido', () => {
  const r = checkEmailSchema.safeParse({ email: 'a@b.com', store_id: 5 });
  assert.equal(r.success, true);
});
test('AUTH: checkEmailSchema rechaza email inválido', () => {
  const r = checkEmailSchema.safeParse({ email: 'no-es-email' });
  assert.equal(r.success, false);
});
test('AUTH: checkEmailSchema rechaza email vacío', () => {
  const r = checkEmailSchema.safeParse({ email: '' });
  assert.equal(r.success, false);
});
test('AUTH: verifyOtpSchema exige código de 6 dígitos', () => {
  assert.equal(verifyOtpSchema.safeParse({ email: 'a@b.com', code: '12345', store_id: 1 }).success, false);
  assert.equal(verifyOtpSchema.safeParse({ email: 'a@b.com', code: '123456', store_id: 1 }).success, true);
});
test('AUTH: verifyOtpSchema rechaza store_id faltante', () => {
  assert.equal(verifyOtpSchema.safeParse({ email: 'a@b.com', code: '123456' }).success, false);
});
test('AUTH: adminLoginSchema exige usuario y contraseña', () => {
  assert.equal(adminLoginSchema.safeParse({ username: '', password: 'x' }).success, false);
  assert.equal(adminLoginSchema.safeParse({ username: 'u', password: '' }).success, false);
  assert.equal(adminLoginSchema.safeParse({ username: 'u', password: 'p' }).success, true);
});

test('ORDER: placeOrderSchema acepta pedido válido', () => {
  const body = {
    store_id: 1,
    items: [{ product_id: 10, quantity: 2 }],
    delivery_address: 'Calle falsa 123',
    payment_method: 'CASH'
  };
  assert.equal(placeOrderSchema.safeParse(body).success, true);
});
test('ORDER: placeOrderSchema rechaza sin items', () => {
  const body = {
    store_id: 1,
    items: [],
    delivery_address: 'Calle falsa 123',
    payment_method: 'CASH'
  };
  assert.equal(placeOrderSchema.safeParse(body).success, false);
});
test('ORDER: placeOrderSchema rechaza payment_method inválido', () => {
  const body = {
    store_id: 1,
    items: [{ product_id: 10, quantity: 1 }],
    delivery_address: 'Calle falsa 123',
    payment_method: 'BITCOIN'
  };
  assert.equal(placeOrderSchema.safeParse(body).success, false);
});
test('ORDER: placeOrderSchema rechaza dirección muy corta', () => {
  const body = {
    store_id: 1,
    items: [{ product_id: 10, quantity: 1 }],
    delivery_address: 'Casa',
    payment_method: 'CASH'
  };
  assert.equal(placeOrderSchema.safeParse(body).success, false);
});
test('ORDER: updateOrderStatusSchema acepta estados válidos', () => {
  for (const s of ['PENDING', 'ACCEPTED', 'DISPATCHED', 'DELIVERED', 'CANCELLED']) {
    assert.equal(updateOrderStatusSchema.safeParse({ status: s }).success, true, s);
  }
});
test('ORDER: updateOrderStatusSchema rechaza estado inválido', () => {
  assert.equal(updateOrderStatusSchema.safeParse({ status: 'INVENTADO' }).success, false);
});
test('ORDER: batchStatusSchema acepta >1 ids y rechaza vacío', () => {
  assert.equal(batchStatusSchema.safeParse({ order_ids: [1, 2], status: 'ACCEPTED' }).success, true);
  assert.equal(batchStatusSchema.safeParse({ order_ids: [], status: 'ACCEPTED' }).success, false);
  assert.equal(batchStatusSchema.safeParse({ order_ids: [1, 2], status: 'DELIVERED' }).success, true);
});