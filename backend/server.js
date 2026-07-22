require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

// Configurar Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Permitir peticiones del frontend
    methods: ['GET', 'POST']
  }
});

// Guardar la instancia de io en app para usarla en los controladores
app.set('io', io);

// Eventos de WebSocket
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);

  // El dashboard de la tienda se unirá a su propia sala
  socket.on('join_store', (store_id) => {
    const room = `store_${store_id}`;
    socket.join(room);
    console.log(`🏢 Tienda ${store_id} se unió a la sala ${room} para escuchar pedidos`);
  });

  // El tracker del cliente se une a su propia sala
  socket.on('join_client', (user_id) => {
    const room = `client_${user_id}`;
    socket.join(room);
    console.log(`👤 Cliente ${user_id} se unió a la sala ${room} para rastrear su pedido`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);
  });
});

// Middlewares
app.use(cors()); // Permite peticiones del frontend
app.use(express.json()); // Parsea los bodies como JSON

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
