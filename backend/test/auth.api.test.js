const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { req, clientToken, prisma } = require('./helpers');

const EMAIL = `test-auth-${Date.now()}@example.com`;
const EMAIL_DUP = `test-auth-dup-${Date.now()}@example.com`;
const PHONE = `0411${String(Date.now()).slice(-7)}`;
let firstStoreId = 1;
let secondStoreId = null;
let secondProduct = null;
const createdUserIds = [];

const cleanupUser = async (userId) => {
  const orders = await prisma.order.findMany({ where: { user_id: userId } });
  for (const order of orders) {
    await prisma.orderItem.deleteMany({ where: { order_id: order.id } });
  }
  await prisma.order.deleteMany({ where: { user_id: userId } });
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
};

before(async () => {
  await prisma.verificationCode.deleteMany({ where: { email: { in: [EMAIL, EMAIL_DUP] } } });

  const store = await prisma.store.create({
    data: {
      name: `Test Store Auth ${Date.now()}`,
      slug: `test-auth-store-${Date.now()}`,
      is_active: true
    }
  });
  secondStoreId = store.id;

  secondProduct = await prisma.product.create({
    data: {
      store_id: secondStoreId,
      name: `Test Auth Product ${Date.now()}`,
      price: 7.5,
      stock: 100,
      is_available: true
    }
  });
});

after(async () => {
  for (const userId of createdUserIds) {
    await cleanupUser(userId);
  }
  if (secondProduct) {
    await prisma.product.delete({ where: { id: secondProduct.id } }).catch(() => {});
  }
  if (secondStoreId) {
    await prisma.user.deleteMany({ where: { store_id: secondStoreId } });
    await prisma.store.delete({ where: { id: secondStoreId } }).catch(() => {});
  }
  await prisma.verificationCode.deleteMany({ where: { email: { in: [EMAIL, EMAIL_DUP] } } });
});

test('check-email: 400 sin store_id', async () => {
  const res = await req('POST', '/auth/check-email', { body: { email: EMAIL } });
  assert.equal(res.status, 400, JSON.stringify(res.json));
});

let firstStoreOtp = null;
let secondStoreOtp = null;

test('check-email: 200 y genera código hasheado con SHA-256 en DB (F3-13)', async () => {
  const res = await req('POST', '/auth/check-email', { body: { email: EMAIL, store_id: firstStoreId } });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.equal(res.json.is_registered, false);
  firstStoreOtp = res.json._dev_otp;
  assert.ok(firstStoreOtp, 'Debe devolver código OTP de prueba');
  assert.equal(firstStoreOtp.length, 6);

  const code = await prisma.verificationCode.findFirst({ where: { email: EMAIL, store_id: firstStoreId } });
  assert.ok(code, 'debe existir código en DB');
  assert.equal(code.code.length, 64, 'El código en la base de datos debe ser un hash SHA-256 de 64 caracteres');
  assert.notEqual(code.code, firstStoreOtp, 'La base de datos nunca debe guardar el código en texto plano');
});

test('check-email: redosificación bloqueada (429) dentro del minuto', async () => {
  const res = await req('POST', '/auth/check-email', { body: { email: EMAIL, store_id: firstStoreId } });
  assert.equal(res.status, 429, JSON.stringify(res.json));
});

test('check-email: 400 con email inválido', async () => {
  const res = await req('POST', '/auth/check-email', { body: { email: 'invalido', store_id: firstStoreId } });
  assert.equal(res.status, 400);
});

test('verify-otp: 200 crea usuario cliente y devuelve cookie', async () => {
  const res = await req('POST', '/auth/verify-otp', {
    body: { email: EMAIL, code: firstStoreOtp, store_id: firstStoreId, name: 'Test Auth', phone: PHONE }
  });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.equal(res.json.user.name, 'Test Auth');
  assert.equal(res.json.user.role, 'CLIENT');
  createdUserIds.push(res.json.user.id);
});

test('verify-otp: 400 con código inválido', async () => {
  const res = await req('POST', '/auth/verify-otp', { body: { email: EMAIL, code: '999999', store_id: firstStoreId } });
  assert.equal(res.status, 400);
});

test('verify-otp: el mismo código no se puede reutilizar', async () => {
  const res = await req('POST', '/auth/verify-otp', { body: { email: EMAIL, code: firstStoreOtp || '123456', store_id: firstStoreId } });
  assert.equal(res.status, 400);
});

test('check-email: el mismo correo no está registrado en otra tienda', async () => {
  const res = await req('POST', '/auth/check-email', { body: { email: EMAIL, store_id: secondStoreId } });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.equal(res.json.is_registered, false);
  secondStoreOtp = res.json._dev_otp;
  assert.ok(secondStoreOtp);
});

test('verify-otp: un código de una tienda no sirve en otra', async () => {
  const res = await req('POST', '/auth/verify-otp', {
    body: { email: EMAIL, code: secondStoreOtp, store_id: firstStoreId, name: 'Test Auth', phone: PHONE }
  });
  assert.equal(res.status, 400, JSON.stringify(res.json));
});

test('verify-otp: mismo correo y teléfono se registran en otra tienda', async () => {
  const res = await req('POST', '/auth/verify-otp', {
    body: { email: EMAIL, code: secondStoreOtp, store_id: secondStoreId, name: 'Test Auth Store 2', phone: PHONE }
  });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.notEqual(res.json.user.id, createdUserIds[0]);
  createdUserIds.push(res.json.user.id);
});

test('F1-34: el mismo correo compra en dos tiendas sin mezclar pedidos', async () => {
  const [userOneId, userTwoId] = createdUserIds;

  const placed = await req('POST', '/orders/place', {
    token: clientToken(userTwoId, secondStoreId),
    body: {
      store_id: secondStoreId,
      items: [{ product_id: secondProduct.id, quantity: 1 }],
      delivery_address: 'Av. Principal 123, Torre A',
      payment_method: 'CASH'
    }
  });
  assert.equal(placed.status, 200, JSON.stringify(placed.json));

  const storeTwoOrders = await req('GET', '/orders/my-orders', { token: clientToken(userTwoId, secondStoreId) });
  assert.equal(storeTwoOrders.status, 200, JSON.stringify(storeTwoOrders.json));
  assert.ok(storeTwoOrders.json.some((order) => order.id === placed.json.order_id));
  assert.ok(storeTwoOrders.json.every((order) => order.store_id === secondStoreId));

  const storeOneOrders = await req('GET', '/orders/my-orders', { token: clientToken(userOneId, firstStoreId) });
  assert.equal(storeOneOrders.status, 200, JSON.stringify(storeOneOrders.json));
  assert.ok(storeOneOrders.json.every((order) => order.id !== placed.json.order_id));
});

test('DB: teléfono duplicado dentro de la misma tienda se rechaza (P2002)', async () => {
  const existing = await prisma.user.findUnique({ where: { id: createdUserIds[0] } });
  assert.ok(existing?.phone, 'el usuario de prueba debe tener teléfono normalizado');
  await assert.rejects(
    prisma.user.create({
      data: { store_id: firstStoreId, email: EMAIL_DUP, phone: existing.phone, name: 'Duplicate Phone' }
    }),
    (error) => error.code === 'P2002'
  );
});

test('admin-login: 401 con contraseña incorrecta', async () => {
  const res = await req('POST', '/auth/admin-login', { body: { username: 'admin_demo', password: 'incorrecta' } });
  assert.equal(res.status, 401, JSON.stringify(res.json));
});

test('admin-login: 200 con credenciales válidas', async () => {
  const demoPassword = process.env.DEMO_PASSWORD || 'TiendaFast2026!';
  const res = await req('POST', '/auth/admin-login', { body: { username: 'admin_demo', password: demoPassword } });
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

test('change-password: 401 sin token', async () => {
  const res = await req('POST', '/auth/change-password', {
    body: { current_password: 'old', new_password: 'newpassword123' }
  });
  assert.equal(res.status, 401);
});

test('change-password: flujo completo (validación, cambio y re-login)', async () => {
  const bcrypt = require('bcrypt');
  const tempUser = `pwd_test_${Date.now()}`;
  const initialPassword = 'InitialPassword123!';
  const hashedPassword = await bcrypt.hash(initialPassword, 10);
  const created = await prisma.user.create({
    data: {
      username: tempUser,
      password: hashedPassword,
      name: 'Password Test User',
      role: 'ADMIN',
      store_id: 1,
      phone: `04${String(Date.now()).slice(0, 9)}`
    }
  });

  const { adminToken } = require('./helpers');
  const token = adminToken(1, created.id);

  try {
    // Falla si la contraseña actual no coincide (401 Unauthorized)
    const failCurrent = await req('POST', '/auth/change-password', {
      token,
      body: { current_password: 'WrongPassword!', new_password: 'NewValidPassword123!' }
    });
    assert.equal(failCurrent.status, 401);

    // Falla si la nueva contraseña es muy corta
    const failShort = await req('POST', '/auth/change-password', {
      token,
      body: { current_password: initialPassword, new_password: '123' }
    });
    assert.equal(failShort.status, 400);

    // Éxito con contraseña válida
    const successRes = await req('POST', '/auth/change-password', {
      token,
      body: { current_password: initialPassword, new_password: 'NewValidPassword123!' }
    });
    assert.equal(successRes.status, 200, JSON.stringify(successRes.json));

    // Verificar en base de datos que el hash corresponde a la nueva contraseña y no a la antigua
    const updated = await prisma.user.findUnique({ where: { id: created.id } });
    assert.ok(await bcrypt.compare('NewValidPassword123!', updated.password), 'debe coincidir con la nueva contraseña');
    assert.equal(await bcrypt.compare(initialPassword, updated.password), false, 'no debe coincidir con la contraseña vieja');
    assert.equal(updated.failed_attempts, 0);
    assert.equal(updated.locked_until, null);
  } finally {
    await prisma.user.delete({ where: { id: created.id } }).catch(() => {});
  }
});
