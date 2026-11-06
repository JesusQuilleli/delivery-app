require('dotenv').config();
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

const BASE = process.env.TEST_API_URL || 'http://localhost:3000/api';
const JWT_SECRET = process.env.JWT_SECRET;
const DEMO_STORE_ID = 1;

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

function adminToken(storeId = DEMO_STORE_ID, id = 99001) {
  return signToken({ id, role: 'ADMIN', username: 'test_admin', store_id: storeId });
}

function superadminToken(id = 99002) {
  return signToken({ id, role: 'SUPERADMIN', username: 'test_super', store_id: null });
}

function clientToken(userId, storeId = DEMO_STORE_ID) {
  return signToken({ id: userId, role: 'CLIENT', email: 'client-test@example.com', store_id: storeId });
}

async function req(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json', 'x-test-suite': '1' };
  if (token) headers.Cookie = `auth_token=${token}`;
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    return { status: 0, json: { error: `NETWORK: ${e.message}` } };
  }
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

async function getDemoProduct() {
  const res = await req('GET', '/stores/demo-farmacia/products?limit=1');
  return res.json.products ? res.json.products[0] : null;
}

module.exports = { BASE, DEMO_STORE_ID, signToken, adminToken, superadminToken, clientToken, req, getDemoProduct, prisma };