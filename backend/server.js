require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

const storeRoutes = require('./routes/storeRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const superadminRoutes = require('./routes/superadminRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Lista blanca de orígenes permitidos (CORS restrictivo)
const allowedOrigins = [
  'https://test.shop-mg.com',
  'http://localhost:5173'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (ej. Postman, scripts de backend a backend)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origen no permitido: ${origin}`));
    }
  },
  credentials: true, // Necesario para que el navegador envíe y reciba cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Configurar Socket.io con los mismos orígenes permitidos
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Guardar la instancia de io en app para usarla en los controladores
app.set('io', io);

// Eventos de WebSocket
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);

  socket.on('join_store', (store_id) => {
    const room = `store_${store_id}`;
    socket.join(room);
    console.log(`🏢 Tienda ${store_id} se unió a la sala ${room}`);
  });

  socket.on('join_client', (user_id) => {
    const room = `client_${user_id}`;
    socket.join(room);
    console.log(`👤 Cliente ${user_id} se unió a la sala ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);
  });
});

// Middlewares
app.use(cors(corsOptions));
app.use(cookieParser()); // Parsea cookies de las peticiones
app.use(express.json());

// Rutas API REST
app.use('/api/stores', storeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/superadmin', superadminRoutes);

// Ruta de prueba base
app.get('/', (req, res) => {
  res.send('✅ API Delivery Frictionless está corriendo...');
});

// Levantar el servidor usando 'server'
server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`=========================================`);
});
