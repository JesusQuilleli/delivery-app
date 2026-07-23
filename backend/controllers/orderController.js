const prisma = require('../prismaClient');

const placeOrder = async (req, res) => {
  try {
    const { 
      store_id, 
      items, 
      delivery_address, 
      latitude, 
      longitude, 
      total_amount, 
      payment_method, 
      payment_reference 
    } = req.body;

    // 1. Validaciones básicas
    if (!store_id || !items || items.length === 0 || !delivery_address || !total_amount || !payment_method) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para crear el pedido' });
    }

    // Validar referencia si es Pago Móvil / Transferencia
    if (payment_method === 'TRANSFER' && !payment_reference) {
      return res.status(400).json({ error: 'La referencia de pago es obligatoria para pagos móviles' });
    }

    // 2. Usar el usuario autenticado del middleware
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // 2.5 Calcular distancia y tiempo si hay coordenadas
    const store = await prisma.store.findUnique({ where: { id: Number(store_id) } });
    let distance_km = null;
    let estimated_minutes = null;
    
    if (store && store.latitude && store.longitude && latitude && longitude) {
      const latNum = parseFloat(latitude);
      const lonNum = parseFloat(longitude);
      const R = 6371; // Radio de la Tierra en km
      const dLat = (latNum - store.latitude) * (Math.PI / 180);
      const dLon = (lonNum - store.longitude) * (Math.PI / 180);
      const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(store.latitude*(Math.PI/180))*Math.cos(latNum*(Math.PI/180))*Math.sin(dLon/2)*Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distance_km = R * c * 1.4; // Factor de desvío de calles (aprox 40% más de distancia lineal)
      estimated_minutes = Math.round((distance_km / 25) * 60) + 15; // 25km/h velocidad promedio + 15 mins prep
    }

    // 3. Crear la orden y los items en la BD usando una operación anidada
    const order = await prisma.order.create({
      data: {
        store_id: Number(store_id),
        user_id: user.id,
        delivery_address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        distance_km,
        estimated_minutes,
        total_amount: parseFloat(total_amount),
        payment_method,
        payment_reference: payment_reference || null,
        status: payment_method === 'TRANSFER' ? 'AWAITING_PAYMENT' : 'PENDING',
        items: {
          create: items.map(item => ({
            product: { connect: { id: Number(item.product_id) } },
            quantity: Number(item.quantity),
            unit_price: parseFloat(item.unit_price)
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true // Incluimos info del producto para mostrar en el Dashboard
          }
        },
        user: true // Incluimos datos del cliente
      }
    });

    // 4. Emitir el evento de WebSockets usando 'io'
    const io = req.app.get('io');
    const room = `store_${store_id}`;
    
    // Emitimos toda la data de la orden a la tienda
    io.to(room).emit('nuevo_pedido', order);

    res.json({ 
      message: 'Pedido creado exitosamente', 
      order_id: order.id,
      estimated_minutes: order.estimated_minutes
    });

  } catch (error) {
    console.error('Error al procesar pedido:', error);
    res.status(500).json({ error: 'Error interno al procesar el pedido' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancel_reason, driver_id } = req.body; // ACCEPTED, DISPATCHED, DELIVERED, CANCELLED
    const user = req.user; // ADMIN
    
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'No autorizado' });

    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: { 
        status, 
        cancel_reason: cancel_reason || undefined,
        driver_id: driver_id ? Number(driver_id) : undefined
      },
      include: {
        user: true,
        items: {
          include: {
            product: true
          }
        },
        driver: true
      }
    });

    // Notificar al cliente a través de WebSockets
    const io = req.app.get('io');
    const clientRoom = `client_${order.user_id}`;
    io.to(clientRoom).emit('estado_actualizado', order);

    // También notificar a la tienda para que el dashboard de otros admins se actualice
    const storeRoom = `store_${order.store_id}`;
    io.to(storeRoom).emit('pedido_actualizado', order);

    res.json({ message: 'Estado actualizado', order });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error interno al actualizar estado' });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prisma delete
    await prisma.orderItem.deleteMany({ where: { order_id: Number(id) } });
    await prisma.order.delete({ where: { id: Number(id) } });
    
    res.json({ message: 'Orden eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    res.status(500).json({ error: 'Error interno al eliminar la orden' });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Usuario no autenticado' });

    const orders = await prisma.order.findMany({
      where: { user_id: user.id },
      include: {
        items: { include: { product: true } },
        store: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching my orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const rateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    const user = req.user;

    if (!user) return res.status(401).json({ error: 'No autenticado' });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Calificación inválida' });

    // Verificar que la orden pertenece al cliente
    const existingOrder = await prisma.order.findUnique({ where: { id: Number(id) } });
    if (!existingOrder || existingOrder.user_id !== user.id) {
      return res.status(403).json({ error: 'No tienes permiso para calificar este pedido' });
    }

    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: { 
        status: 'DELIVERED', // Se marca como entregado implícitamente
        client_rating: rating,
        client_review: review || null
      },
      include: { user: true, items: { include: { product: true } } }
    });

    const io = req.app.get('io');
    const clientRoom = `client_${order.user_id}`;
    io.to(clientRoom).emit('estado_actualizado', order);

    const storeRoom = `store_${order.store_id}`;
    io.to(storeRoom).emit('pedido_actualizado', order);

    res.json({ message: 'Pedido calificado exitosamente', order });
  } catch (error) {
    console.error('Error al calificar pedido:', error);
    res.status(500).json({ error: 'Error interno al calificar pedido' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const orderId = Number(id);
    if (isNaN(orderId)) return res.status(400).json({ error: 'ID inválido' });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true },
        },
        user: {
          select: { id: true, name: true, phone: true }
        }
      },
    });

    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    res.json(order);
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({ error: 'Error interno obteniendo el pedido' });
  }
};

const cancelOrderClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancel_reason } = req.body;
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'No autenticado' });

    const existingOrder = await prisma.order.findUnique({ where: { id: Number(id) } });
    
    if (!existingOrder || existingOrder.user_id !== user.id) {
      return res.status(403).json({ error: 'No tienes permiso para cancelar este pedido' });
    }

    if (existingOrder.status !== 'PENDING') {
      return res.status(400).json({ error: 'Solo se pueden cancelar pedidos pendientes' });
    }

    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: { status: 'CANCELLED', cancel_reason: cancel_reason || null },
      include: { user: true, items: { include: { product: true } } }
    });

    const io = req.app.get('io');
    const clientRoom = `client_${order.user_id}`;
    io.to(clientRoom).emit('estado_actualizado', order);

    const storeRoom = `store_${order.store_id}`;
    io.to(storeRoom).emit('pedido_actualizado', order);

    res.json({ message: 'Pedido cancelado', order });
  } catch (error) {
    console.error('Error al cancelar pedido:', error);
    res.status(500).json({ error: 'Error interno al cancelar pedido' });
  }
};

module.exports = { placeOrder, updateOrderStatus, deleteOrder, getMyOrders, rateOrder, getOrderById, cancelOrderClient };
