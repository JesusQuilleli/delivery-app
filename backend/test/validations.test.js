const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkEmailSchema, verifyOtpSchema, adminLoginSchema } = require('../validations/authValidation');
const { placeOrderSchema, updateOrderStatusSchema, batchStatusSchema, prescriptionReviewSchema } = require('../validations/orderValidation');
const { storeSettingsSchema, driverSchema, changePasswordSchema, superadminStoreSchema } = require('../validations/storeValidation');

test('AUTH: checkEmailSchema acepta email válido', () => {
  const r = checkEmailSchema.safeParse({ email: 'a@b.com', store_id: 5 });
  assert.equal(r.success, true);
});
test('AUTH: checkEmailSchema rechaza email inválido', () => {
  const r = checkEmailSchema.safeParse({ email: 'no-es-email', store_id: 5 });
  assert.equal(r.success, false);
});
test('AUTH: checkEmailSchema rechaza email vacío', () => {
  const r = checkEmailSchema.safeParse({ email: '', store_id: 5 });
  assert.equal(r.success, false);
});
test('AUTH: checkEmailSchema exige store_id', () => {
  const r = checkEmailSchema.safeParse({ email: 'a@b.com' });
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
test('ORDER: TRANSFER exige referencia numérica de 4 a 10 dígitos', () => {
  const base = {
    store_id: 1,
    items: [{ product_id: 10, quantity: 1 }],
    delivery_address: 'Calle falsa 123',
    payment_method: 'TRANSFER'
  };
  assert.equal(placeOrderSchema.safeParse({ ...base, payment_reference: '1234' }).success, true);
  assert.equal(placeOrderSchema.safeParse({ ...base, payment_reference: '1234567890' }).success, true);
  assert.equal(placeOrderSchema.safeParse({ ...base, payment_reference: '123' }).success, false);
  assert.equal(placeOrderSchema.safeParse({ ...base, payment_reference: 'ABC123' }).success, false);
  assert.equal(placeOrderSchema.safeParse({ ...base, payment_reference: undefined }).success, false);
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

test('STORE: storeSettingsSchema valida campos y rechaza coordenadas/industria inválidas', () => {
  assert.equal(storeSettingsSchema.safeParse({ industry: 'RESTAURANT', delivery_fee: 2.5 }).success, true);
  assert.equal(storeSettingsSchema.safeParse({ industry: 'AEROLINEA' }).success, false);
  assert.equal(storeSettingsSchema.safeParse({ latitude: 150 }).success, false);
  assert.equal(storeSettingsSchema.safeParse({ delivery_fee: -5 }).success, false);
});

test('DRIVER: driverSchema valida nombre y teléfono', () => {
  assert.equal(driverSchema.safeParse({ name: 'Carlos', phone: '+584121234567' }).success, true);
  assert.equal(driverSchema.safeParse({ name: '', phone: '+584121234567' }).success, false);
  assert.equal(driverSchema.safeParse({ name: 'Carlos', phone: '123' }).success, false);
});

test('AUTH: changePasswordSchema exige 6 caracteres mínimos', () => {
  assert.equal(changePasswordSchema.safeParse({ currentPassword: 'old', newPassword: '123' }).success, false);
  assert.equal(changePasswordSchema.safeParse({ currentPassword: 'old', newPassword: 'securePass1' }).success, true);
});

test('SUPERADMIN: superadminStoreSchema valida slug y requeridos', () => {
  const valid = {
    storeName: 'Farmacia Nueva',
    slug: 'farmacia-nueva',
    adminUsername: 'admin_nueva',
    adminPassword: 'password123',
    adminPhone: '+584141234567',
    industry: 'PHARMACY',
    plan: 'EMPRENDEDOR'
  };
  assert.equal(superadminStoreSchema.safeParse(valid).success, true);
  assert.equal(superadminStoreSchema.safeParse({ ...valid, slug: 'SLUG CON ESPACIO' }).success, false);
  assert.equal(superadminStoreSchema.safeParse({ ...valid, adminPassword: '123' }).success, false);
});
test('ORDER: prescriptionReviewSchema valida estados de récipe y notas', () => {
  assert.equal(prescriptionReviewSchema.safeParse({ status: 'APPROVED', notes: 'Dosis validada' }).success, true);
  assert.equal(prescriptionReviewSchema.safeParse({ status: 'REJECTED', notes: 'Récipe expirado' }).success, true);
  assert.equal(prescriptionReviewSchema.safeParse({ status: 'PENDING' }).success, false);
  assert.equal(prescriptionReviewSchema.safeParse({ status: 'INVALID' }).success, false);
});
