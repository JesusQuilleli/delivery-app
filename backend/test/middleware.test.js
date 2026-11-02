require('dotenv').config();
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { requireAuth, requireAdmin, requireSuperAdmin, requireStoreAdmin } = require('../middleware/authMiddleware');
const { signToken } = require('./helpers');

let reqCapture = {};
let resCapture = {};
let current = {};

beforeEach(() => {
  current = { nextCalled: false, nextError: null, statusCode: null, jsonBody: null };
  reqCapture = {};
  resCapture = {
    status(code) { current.statusCode = code; return this; },
    json(body) { current.jsonBody = body; return this; }
  };
});

function next(err) {
  current.nextCalled = true;
  current.nextError = err || null;
}

test('validate: pasa body válido al next()', () => {
  const schema = z.object({ name: z.string() });
  validate(schema)({ body: { name: 'ok' } }, resCapture, next);
  assert.equal(current.nextCalled, true);
  assert.equal(current.statusCode, null);
});

test('validate: responde 400 con body inválido', () => {
  const schema = z.object({ name: z.string().min(1, 'requerido') });
  validate(schema)({ body: { name: '' } }, resCapture, next);
  assert.equal(current.nextCalled, false);
  assert.equal(current.statusCode, 400);
  assert.equal(current.jsonBody.error.includes('requerido'), true);
});

test('requireAuth: 401 sin token', () => {
  requireAuth({ cookies: {} }, resCapture, next);
  assert.equal(current.statusCode, 401);
});

test('requireAuth: 401 token inválido', () => {
  requireAuth({ cookies: { auth_token: 'basura' } }, resCapture, next);
  assert.equal(current.statusCode, 401);
});

test('requireAuth: next() con token válido', () => {
  const token = signToken({ id: 1, role: 'CLIENT' });
  requireAuth({ cookies: { auth_token: token } }, resCapture, next);
  assert.equal(current.nextCalled, true);
});

test('requireAdmin: 403 con rol CLIENT', () => {
  const token = signToken({ id: 1, role: 'CLIENT' });
  requireAdmin({ cookies: { auth_token: token } }, resCapture, next);
  assert.equal(current.statusCode, 403);
});

test('requireAdmin: next() con rol ADMIN', () => {
  const token = signToken({ id: 1, role: 'ADMIN' });
  requireAdmin({ cookies: { auth_token: token } }, resCapture, next);
  assert.equal(current.nextCalled, true);
});

test('requireSuperAdmin: 403 con rol ADMIN', () => {
  const token = signToken({ id: 1, role: 'ADMIN' });
  requireSuperAdmin({ cookies: { auth_token: token } }, resCapture, next);
  assert.equal(current.statusCode, 403);
});

const tick = () => new Promise(r => setTimeout(r, 200));

test('requireStoreAdmin: SUPERADMIN pasa sin consultar DB', async () => {
  const token = signToken({ id: 1, role: 'SUPERADMIN', store_id: null });
  await requireStoreAdmin({ cookies: { auth_token: token }, params: { slug: 'cualquiera' } }, resCapture, next);
  await tick();
  assert.equal(current.nextCalled, true);
  assert.equal(current.statusCode, null);
});

test('requireStoreAdmin: el ownership por tienda (403/404) se valida en las suites HTTP', () => {
  assert.equal(true, true);
});