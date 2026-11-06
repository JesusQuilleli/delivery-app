require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const storeRoutes = require('./routes/storeRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const superadminRoutes = require('./routes/superadminRoutes');
const ratesRoutes = require('./routes/ratesRoutes');
const geocodingRoutes = require('./routes/geocodingRoutes');
const { globalLimiter } = require('./middleware/rateLimiter');
const { JWT_SECRET } = require('./middleware/authMiddleware');
const serializeDecimals = require('./middleware/serialize');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// F3-07: Configurar trust proxy para proxies inversos (Render / Nginx)
app.set('trust proxy', 1);

// Lista blanca de orígenes permitidos (CORS restrictivo)
const defaultOrigins = [
  'https://test.shop-mg.com',
  'http://localhost:5173'
];

// Orígenes de desarrollo en red local (solo en desarrollo)
const isDevOrigin = (origin) => {
  if (!origin) return false;
  if (process.env.NODE_ENV === 'production') return false;
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.16.');
  } catch {
    return false;
  }
};

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? [...new Set([...defaultOrigins, ...process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)])]
  : defaultOrigins;

console.log('🛡️ Orígenes CORS permitidos:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('CORS: Origen requerido'));
      }
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin) || isDevOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origen no permitido: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Configurar Socket.io con CORS y credenciales
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        if (process.env.NODE_ENV === 'production') {
          return callback(new Error('CORS: Origen requerido'));
        }
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin) || isDevOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origen no permitido: ${origin}`));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// F3-01: Autenticación en el handshake de Socket.io mediante cookie httpOnly o auth token
io.use((socket, next) => {
  try {
    let token = null;

    const cookieHeader = socket.handshake.headers.cookie;
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
          const [k, ...v] = c.trim().split('=');
          return [k, decodeURIComponent(v.join('='))];
        })
      );
      token = cookies['auth_token'];
    }

    if (!token && socket.handshake.auth && socket.handshake.auth.token) {
      token = socket.handshake.auth.token;
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded; // { id, role, store_id, email, username }
    } else {
      socket.user = null;
    }

    next();
  } catch (err) {
    socket.user = null;
    next();
  }
});

app.set('io', io);

// Eventos y autorización de salas WebSocket
io.on('connection', (socket) => {
  // F3-02: Autorizar join_store según rol y tienda
  socket.on('join_store', (store_id) => {
    const numericStoreId = Number(store_id);
    if (!Number.isInteger(numericStoreId) || numericStoreId <= 0) {
      return socket.emit('error', { message: 'ID de tienda inválido' });
    }

    const user = socket.user;
    const isAuthorized = user && (
      user.role === 'SUPERADMIN' ||
      (user.role === 'ADMIN' && user.store_id === numericStoreId)
    );

    if (!isAuthorized) {
      console.warn(`[SECURITY] Intento no autorizado de unirse a store_${numericStoreId} por socket ${socket.id}`);
      return socket.emit('unauthorized', { message: 'No tienes permiso para escuchar eventos de esta tienda' });
    }

    const room = `store_${numericStoreId}`;
    socket.join(room);
  });

  // F3-03: Autorizar join_client según identidad del usuario
  socket.on('join_client', (user_id) => {
    const numericUserId = Number(user_id);
    if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
      return socket.emit('error', { message: 'ID de cliente inválido' });
    }

    const user = socket.user;
    const isAuthorized = user && (
      user.id === numericUserId ||
      user.role === 'ADMIN' ||
      user.role === 'SUPERADMIN'
    );

    if (!isAuthorized) {
      console.warn(`[SECURITY] Intento no autorizado de unirse a client_${numericUserId} por socket ${socket.id}`);
      return socket.emit('unauthorized', { message: 'No tienes permiso para escuchar eventos de este cliente' });
    }

    const room = `client_${numericUserId}`;
    socket.join(room);
  });

  // F2D-03: Sala de seguimiento en vivo por orden (sin refrescar)
  socket.on('join_order', (order_id) => {
    const numericOrderId = Number(order_id);
    if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) {
      return socket.emit('error', { message: 'ID de orden inválido' });
    }
    socket.join(`order_${numericOrderId}`);
  });

  socket.on('disconnect', () => {});
});

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false
}));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(serializeDecimals);
app.use(globalLimiter);

// Endpoint de Healthcheck (F3-27 / F3B-00)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Rutas API REST
app.use('/api/stores', storeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/geocode', geocodingRoutes);

// Ruta base
app.get('/', (req, res) => {
  res.send('✅ API Delivery Frictionless está corriendo...');
});

// F3-28: Manejador centralizado de errores
app.use((err, req, res, next) => {
  console.error('[SERVER_ERROR]', err);
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Error interno del servidor'
      : err.message || 'Error inesperado'
  });
});

// Levantar el servidor
server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`=========================================`);
});
