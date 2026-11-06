const { test } = require('node:test');
const assert = require('node:assert/strict');
const ioClient = require('socket.io-client');
const { signToken, adminToken, clientToken, superadminToken } = require('./helpers');

const SERVER_URL = 'http://localhost:3000';

function connectSocket(token) {
  return new Promise((resolve, reject) => {
    const opts = {
      transports: ['websocket'],
      forceNew: true,
      auth: token ? { token } : {}
    };
    if (token) {
      opts.extraHeaders = {
        Cookie: `auth_token=${token}`
      };
    }
    const socket = ioClient(SERVER_URL, opts);
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => reject(err));
    setTimeout(() => reject(new Error('Socket connection timeout')), 4000);
  });
}

test('socket: usuario anónimo es rechazado al intentar unirse a sala privada de tienda (F3-02)', async () => {
  const socket = await connectSocket(null);

  const unauthorizedPromise = new Promise((resolve) => {
    socket.on('unauthorized', (data) => resolve(data));
  });

  socket.emit('join_store', 1);
  const data = await unauthorizedPromise;
  assert.ok(data.message.includes('No tienes permiso'));
  socket.disconnect();
});

test('socket: usuario anónimo es rechazado al intentar unirse a sala privada de cliente (F3-03)', async () => {
  const socket = await connectSocket(null);

  const unauthorizedPromise = new Promise((resolve) => {
    socket.on('unauthorized', (data) => resolve(data));
  });

  socket.emit('join_client', 99);
  const data = await unauthorizedPromise;
  assert.ok(data.message.includes('No tienes permiso'));
  socket.disconnect();
});

test('socket: parámetros no numéricos emiten evento error (F3-04)', async () => {
  const socket = await connectSocket(null);

  const errorPromise = new Promise((resolve) => {
    socket.on('error', (err) => resolve(err));
  });

  socket.emit('join_store', 'invalid_id');
  const err = await errorPromise;
  assert.ok(err.message.includes('inválido'));
  socket.disconnect();
});

test('socket: admin de tienda 1 es rechazado al intentar unirse a tienda 2 (F3-02)', async () => {
  const token = adminToken(1); // Admin para store_id: 1
  const socket = await connectSocket(token);

  const unauthorizedPromise = new Promise((resolve) => {
    socket.on('unauthorized', (data) => resolve(data));
  });

  socket.emit('join_store', 2);
  const data = await unauthorizedPromise;
  assert.ok(data.message.includes('No tienes permiso'));
  socket.disconnect();
});

test('socket: cliente de ID 5 es rechazado al intentar unirse a cliente 6 (F3-03)', async () => {
  const token = clientToken(5, 1); // Client con ID: 5
  const socket = await connectSocket(token);

  const unauthorizedPromise = new Promise((resolve) => {
    socket.on('unauthorized', (data) => resolve(data));
  });

  socket.emit('join_client', 6);
  const data = await unauthorizedPromise;
  assert.ok(data.message.includes('No tienes permiso'));
  socket.disconnect();
});
