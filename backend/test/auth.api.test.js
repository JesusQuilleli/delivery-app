const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { req, prisma } = require('./helpers');

const EMAIL = `test-auth-${Date.now()}@example.com`;
let createdUserId = null;

before(async () => {
  await prisma.verificationCode.deleteMany({ where: { email: EMAIL } });
});

after(async () => {
  if (createdUserId) {
    const orders = await prisma.order.findMany({ where: { user_id: createdUserId } });
    for (const o of orders) await prisma.orderItem.deleteMany({ where: { order_id: o.id } });
    await prisma.order.deleteMany({ where: { user_id: createdUserId } });
    await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
  }
  await prisma.verificationCode.deleteMany({ where: { email: EMAIL } });
});

test('check-email: 200 y genera código en DB', async () => {
  const res = await req('POST', '/auth/check-email', { body: { email: EMAIL, store_id: 1 } });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.equal(res.json.is_registered, false);
  const code = await prisma.verificationCode.findFirst({ where: { email: EMAIL } });
  assert.ok(code, 'debe existir código en DB');
  assert.equal(code.code.length, 6);
});

test('check-email: redosificación bloqueada (429) dentro del minuto', async () => {
  const res = await req('POST', '/auth/check-email', { body: { email: EMAIL, store_id: 1 } });
  assert.equal(res.status, 429, JSON.stringify(res.json));
});

test('check-email: 400 con email inválido', async () => {
  const res = await req('POST', '/auth/check-email', { body: { email: 'invalido', store_id: 1 } });
  assert.equal(res.status, 400);
});

test('verify-otp: 200 crea usuario cliente y devuelve cookie', async () => {
  const code = await prisma.verificationCode.findFirst({ where: { email: EMAIL } });
  const res = await req('POST', '/auth/verify-otp', {
    body: { email: EMAIL, code: code.code, store_id: 1, name: 'Test Auth', phone: '0411-000-0000' }
  });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.equal(res.json.user.name, 'Test Auth');
  assert.equal(res.json.user.role, 'CLIENT');
  createdUserId = res.json.user.id;
});

test('verify-otp: 400 con código inválido', async () => {
  const res = await req('POST', '/auth/verify-otp', { body: { email: EMAIL, code: '999999', store_id: 1 } });
  assert.equal(res.status, 400);
});

test('verify-otp: el mismo código no se puede reutilizar', async () => {
  const code = await prisma.verificationCode.findFirst({ where: { email: EMAIL } });
  const res = await req('POST', '/auth/verify-otp', { body: { email: EMAIL, code: code?.code || '123456', store_id: 1 } });
  assert.equal(res.status, 400);
});

test('admin-login: 401 con contraseña incorrecta', async () => {
  const res = await req('POST', '/auth/admin-login', { body: { username: 'admin_demo', password: 'incorrecta' } });
  assert.equal(res.status, 401, JSON.stringify(res.json));
});

test('admin-login: 200 con credenciales válidas', async () => {
  const res = await req('POST', '/auth/admin-login', { body: { username: 'admin_demo', password: 'password123' } });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.equal(res.json.user.role, 'ADMIN');
  assert.equal(res.json.user.store.slug, 'demo-farmacia');
});

test('admin-login: bloqueo tras alcanzar 5 intentos fallidos', async () => {
  const username = `lock_${Date.now()}`;
  await prisma.user.create({
    data: { username, password: 'x_cualquiera', name: 'Lock Test', role: 'ADMIN', store_id: 1, phone: `04${String(Date.now()).slice(0, 9)}` }
  });
  await prisma.user.update({ where: { username }, data: { failed_attempts: 4 } });
  await req('POST', '/auth/admin-login', { body: { username, password: 'incorrecta' } });
  const res = await req('POST', '/auth/admin-login', { body: { username, password: 'incorrecta' } });
  assert.equal(res.status, 423, JSON.stringify(res.json));
  await prisma.user.delete({ where: { username } });
});

test('refresh: 401 sin token', async () => {
  const res = await req('POST', '/auth/refresh');
  assert.equal(res.status, 401);
});

test('logout: 401 sin token', async () => {
  const res = await req('POST', '/auth/logout');
  assert.equal(res.status, 401);
});