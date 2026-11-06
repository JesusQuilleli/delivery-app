const { Prisma } = require('@prisma/client');
const prisma = require('../prismaClient');
const { resolveDeliveryFee } = require('../services/deliveryService');
const { buildStockBreakdown, restoreOrderStock } = require('../services/orderStockService');

const validTransitions = {
  'AWAITING_PAYMENT': ['PENDING', 'CANCELLED'],
  'PENDING': ['ACCEPTED', 'CANCELLED'],
  'ACCEPTED': ['DISPATCHED', 'CANCELLED'],
  'DISPATCHED': ['DELIVERED'],
  'DELIVERED': [],
  'CANCELLED': []
};

const isAllowedTransition = (from, to) => {
  const allowed = validTransitions[from];
  return Array.isArray(allowed) && allowed.includes(to);
};

class StockError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'StockError';
    this.details = details;
  }
}

const placeOrder = async (req, res) => {
  try {
    const {
      store_id,
      items,
      delivery_address,
      address_details,
      latitude,
      longitude,
      payment_method,
      payment_reference
    } = req.body;

    // 1. Validaciones básicas
    if (!store_id || !Array.isArray(items) || items.length === 0 || !delivery_address || !payment_method) {
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

    const storeId = Number(store_id);

    if (user.role !== 'CLIENT') {
      return res.status(403).json({ error: 'Solo los clientes pueden realizar pedidos.' });
    }

    if (user.store_id && Number(user.store_id) !== storeId) {
      return res.status(403).json({ error: 'La sesión no pertenece a esta tienda.' });
    }

    // 2.5 Verificar la tienda y calcular distancia/tiempo
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store || !store.is_active) {
      return res.status(400).json({ error: 'Tienda inactiva o no disponible' });
    }

    const delivery = await resolveDeliveryFee({ store, latitude, longitude });
    const { distance_km, estimated_minutes } = delivery;

    if (delivery.in_range === false) {
      return res.status(400).json({
        error: 'Tu ubicación está fuera del rango de entrega de esta tienda.',
        coverage: delivery.coverage
      });
    }

    // 3. Normalizar cantidades y productos solicitados
    const requested = new Map();
    for (const item of items) {
      const productId = Number(item.product_id);
      const qty = Number(item.quantity);
      if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({ error: 'Productos y cantidades inválidas.' });
      }
      requested.set(productId, (requested.get(productId) || 0) + qty);
    }

    const productIds = [...requested.keys()];
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        store_id: storeId,
        is_available: true
      },
      include: {
        comboItems: {
          include: {
            product: {
              select: { id: true, name: true, stock: true, is_available: true, store_id: true }
            }
          }
        }
      }
    });

        // F2C-08: Bloquear venta de medicamentos vencidos
    const now = new Date();
    for (const p of products) {
      if (p.expires_at && new Date(p.expires_at) < now) {
        return res.status(400).json({ error: `El producto "${p.name}" está vencido y no puede ser comercializado.` });
      }
    }

    // F2C-02: Validar récipe médico obligatorio si algún producto lo requiere
    const requiresPrescription = products.some(p => p.requires_prescription);
    if (requiresPrescription && !prescription_url) {
      return res.status(400).json({
        error: 'Uno o más medicamentos en tu pedido requieren récipe médico. Por favor adjunta la fotografía del récipe para continuar.'
      });
    }

    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'Uno o más productos no existen, no están disponibles o no pertenecen a esta tienda.' });
    }

    const productById = new Map(products.map((product) => [product.id, product]));

    // 4. Calcular stock requerido, incluyendo componentes de combos
    const requiredStock = new Map();
    const stockInfo = new Map(products.map((product) => [product.id, product]));

    for (const [productId, qty] of requested) {
      const product = productById.get(productId);

      if (product.is_combo && product.comboItems.length > 0) {
        for (const component of product.comboItems) {
          const item = component.product;
          if (!item || item.store_id !== storeId || !item.is_available) {
            return res.status(400).json({ error: `El combo "${product.name}" tiene componentes no disponibles.` });
          }
          if (!Number.isInteger(component.quantity) || component.quantity <= 0) {
            return res.status(400).json({ error: `El combo "${product.name}" tiene una cantidad de componente inválida.` });
          }

          stockInfo.set(item.id, item);
          if (item.stock !== null) {
            requiredStock.set(item.id, (requiredStock.get(item.id) || 0) + qty * component.quantity);
          }
        }
      } else if (product.stock !== null) {
        requiredStock.set(product.id, (requiredStock.get(product.id) || 0) + qty);
      }
    }

    // 5. Rechazar antes de crear la orden si no alcanza el stock
    for (const [productId, needed] of requiredStock) {
      const product = stockInfo.get(productId);
      if (product.stock !== null && product.stock < needed) {
        throw new StockError(`Stock insuficiente para "${product.name}".`, [{
          product_id: productId,
          name: product.name,
          requested: needed,
          available: product.stock
        }]);
      }
    }

    // 6. Calcular total real en el servidor con aritmética decimal exacta
    const currency = store.currency || 'USD';
    const delivery_fee = delivery.delivery_fee;
    let subtotal = new Prisma.Decimal(0);
    const verifiedItems = productIds.map((productId) => {
      const product = productById.get(productId);
      const qty = requested.get(productId);
      const unit_price = new Prisma.Decimal(product.price);
      subtotal = subtotal.add(unit_price.mul(qty));
      return {
        product_id: productId,
        quantity: qty,
        unit_price
      };
    });
    const total_amount = subtotal.add(delivery_fee);

    // 7. Descontar stock y crear la orden en una sola transacción
    const order = await prisma.$transaction(async (tx) => {
      for (const [productId, needed] of requiredStock) {
        const updated = await tx.product.updateMany({
          where: {
            id: productId,
            store_id: storeId,
            stock: { gte: needed }
          },
          data: { stock: { decrement: needed } }
        });

        if (updated.count !== 1) {
          const product = stockInfo.get(productId);
          throw new StockError(`Stock insuficiente para "${product.name}".`, [{
            product_id: productId,
            name: product.name,
            requested: needed,
            available: null
          }]);
        }
      }

      return tx.order.create({
        data: {
          store_id: storeId,
          user_id: user.id,
          delivery_address,
          address_details: address_details || null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          distance_km,
          estimated_minutes,
          currency,
          usd_rate: store.usd_rate,
          ves_rate: store.ves_rate,
          cop_rate: store.cop_rate,
          subtotal,
          delivery_fee,
          total_amount,
          stock_breakdown: buildStockBreakdown(requiredStock),
          payment_method,
          payment_reference: payment_reference || null,
          status: payment_method === 'TRANSFER' ? 'AWAITING_PAYMENT' : 'PENDING',
          items: {
            create: verifiedItems.map(item => ({
              product: { connect: { id: item.product_id } },
              quantity: item.quantity,
              unit_price: item.unit_price
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: true
        }
      });
    }, { maxWait: 10000, timeout: 20000 });

    // 8. Emitir el evento de WebSockets usando 'io'
    const io = req.app.get('io');
    if (io) {
      io.to(`store_${storeId}`).emit('nuevo_pedido', order);
    }

    res.json({
      message: 'Pedido creado exitosamente',
      order_id: order.id,
      estimated_minutes: order.estimated_minutes
    });

  } catch (error) {
    if (error instanceof StockError) {
      return res.status(400).json({ error: error.message, details: error.details });
    }
    if (error.code === 'P2028') {
      return res.status(503).json({ error: 'La operación tardó demasiado. Intenta de nuevo.' });
    }
    console.error('Error al procesar pedido:', error);
    res.status(500).json({ error: 'Error interno al procesar el pedido' });
  }
};


const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancel_reason, driver_id } = req.body;
    const user = req.user;

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const existingOrder = await prisma.order.findUnique({ where: { id: Number(id) } });
    if (!existingOrder) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (user.role !== 'SUPERADMIN' && existingOrder.store_id !== user.store_id) {
      return res.status(403).json({ error: 'No tienes permisos sobre este pedido' });
    }

    const allowed = isAllowedTransition(existingOrder.status, status);
    if (!allowed) {
      return res.status(409).json({ error: `No se puede cambiar de ${existingOrder.status} a ${status}. Estado actual ya fue modificado.` });
    }

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: Number(id), status: existingOrder.status },
        data: {
          status,
          cancel_reason: cancel_reason || undefined,
          driver_id: driver_id ? Number(driver_id) : undefined
        }
      });

      if (updated.count !== 1) {
        const conflict = new Error('El pedido fue modificado por otro admin.');
        conflict.code = 'P2025';
        throw conflict;
      }

      if (status === 'CANCELLED') {
        await restoreOrderStock(tx, id);
      }

      return tx.order.findUnique({
        where: { id: Number(id) },
        include: {
          user: true,
          items: { include: { product: true } },
          driver: true
        }
      });
    }, { maxWait: 10000, timeout: 20000 });

    const io = req.app.get('io');
    io.to(`client_${order.user_id}`).emit('estado_actualizado', order);
    io.to(`order_${order.id}`).emit('estado_actualizado', order);
    io.to(`store_${order.store_id}`).emit('pedido_actualizado', order);

    res.json({ message: 'Estado actualizado', order });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(409).json({ error: 'El pedido fue modificado por otro admin. Recargando...' });
    }
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error interno al actualizar estado' });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const existingOrder = await prisma.order.findUnique({ where: { id: Number(id) } });
    if (!existingOrder) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (user.role !== 'SUPERADMIN' && existingOrder.store_id !== user.store_id) {
      return res.status(403).json({ error: 'No tienes permisos sobre este pedido' });
    }

    const restored = await prisma.$transaction(async (tx) => {
      const result = await restoreOrderStock(tx, id);
      await tx.orderItem.deleteMany({ where: { order_id: Number(id) } });
      await tx.order.delete({ where: { id: Number(id) } });
      return result;
    }, { maxWait: 10000, timeout: 20000 });

    res.json({
      message: 'Orden eliminada exitosamente',
      stock_restored: restored.restored
    });
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

const getMyAddresses = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Usuario no autenticado' });

    const orders = await prisma.order.findMany({
      where: {
        user_id: user.id,
        latitude: { not: null },
        longitude: { not: null }
      },
      select: {
        delivery_address: true,
        address_details: true,
        latitude: true,
        longitude: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    const seen = new Set();
    const addresses = [];
    for (const order of orders) {
      const key = `${Number(order.latitude).toFixed(4)}|${Number(order.longitude).toFixed(4)}|${order.delivery_address}`;
      if (seen.has(key)) continue;
      seen.add(key);
      addresses.push({
        address: order.delivery_address,
        address_details: order.address_details,
        latitude: order.latitude,
        longitude: order.longitude,
        last_used_at: order.createdAt
      });
      if (addresses.length >= 5) break;
    }

    res.json(addresses);
  } catch (error) {
    console.error('Error obteniendo direcciones guardadas:', error);
    res.status(500).json({ error: 'Error interno obteniendo direcciones' });
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

    // Solo se puede calificar un pedido ya entregado
    if (existingOrder.status !== 'DELIVERED') {
      return res.status(400).json({ error: 'Solo puedes calificar pedidos ya entregados.' });
    }

    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: { 
        client_rating: rating,
        client_review: review || null
      },
      include: { user: true, items: { include: { product: true } } }
    });

    const io = req.app.get('io');
    const clientRoom = `client_${order.user_id}`;
    io.to(clientRoom).emit('estado_actualizado', order);
    io.to(`order_${order.id}`).emit('estado_actualizado', order);

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
    const user = req.user;
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
        },
        driver: true
      },
    });

    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (user.role !== 'SUPERADMIN' && order.store_id !== user.store_id) {
      return res.status(403).json({ error: 'No tienes permisos sobre este pedido' });
    }

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

    if (!['PENDING', 'AWAITING_PAYMENT'].includes(existingOrder.status)) {
      return res.status(400).json({ error: 'Solo se pueden cancelar pedidos pendientes de pago o de aprobación' });
    }

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: Number(id), status: existingOrder.status },
        data: { status: 'CANCELLED', cancel_reason: cancel_reason || null }
      });

      if (updated.count !== 1) {
        const conflict = new Error('El pedido fue modificado mientras se cancelaba.');
        conflict.code = 'P2025';
        throw conflict;
      }

      await restoreOrderStock(tx, id);

      return tx.order.findUnique({
        where: { id: Number(id) },
        include: { user: true, items: { include: { product: true } } }
      });
    }, { maxWait: 10000, timeout: 20000 });

    const io = req.app.get('io');
    io.to(`client_${order.user_id}`).emit('estado_actualizado', order);
    io.to(`order_${order.id}`).emit('estado_actualizado', order);
    io.to(`store_${order.store_id}`).emit('pedido_actualizado', order);

    res.json({ message: 'Pedido cancelado', order });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(409).json({ error: 'El pedido fue modificado mientras se cancelaba. Recarga e intenta de nuevo.' });
    }
    console.error('Error al cancelar pedido:', error);
    res.status(500).json({ error: 'Error interno al cancelar pedido' });
  }
};

const batchUpdateStatus = async (req, res) => {
  try {
    const { order_ids, status, cancel_reason } = req.body;
    const user = req.user;

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const orders = await prisma.order.findMany({
      where: { id: { in: order_ids } }
    });

    const validForStore = user.role === 'SUPERADMIN'
      ? orders
      : orders.filter(o => o.store_id === user.store_id);

    const ownedIds = validForStore.map(o => o.id);
    const deniedIds = order_ids.filter(id => !ownedIds.includes(id));

    const transitionAllowedIds = validForStore
      .filter(o => isAllowedTransition(o.status, status))
      .map(o => o.id);

    const invalidTransitionIds = ownedIds.filter(id => !transitionAllowedIds.includes(id));

    if (transitionAllowedIds.length === 0) {
      return res.status(409).json({ error: 'Ninguno de los pedidos puede cambiar a ese estado', updated: 0, failed: [...deniedIds, ...invalidTransitionIds] });
    }

    const ordersById = new Map(validForStore.map((order) => [order.id, order]));
    const result = await prisma.$transaction(async (tx) => {
      let count = 0;

      for (const orderId of transitionAllowedIds) {
        const current = ordersById.get(orderId);
        if (!current) continue;

        const updated = await tx.order.updateMany({
          where: { id: orderId, status: current.status },
          data: {
            status,
            cancel_reason: cancel_reason || undefined
          }
        });

        if (updated.count !== 1) continue;
        count += 1;

        if (status === 'CANCELLED') {
          await restoreOrderStock(tx, orderId);
        }
      }

      return { count };
    }, { maxWait: 10000, timeout: 20000 });

    const io = req.app.get('io');
    const updatedOrders = await prisma.order.findMany({
      where: { id: { in: transitionAllowedIds } },
      include: { user: true, items: { include: { product: true } }, driver: true }
    });

    for (const order of updatedOrders) {
      io.to(`client_${order.user_id}`).emit('estado_actualizado', order);
      io.to(`order_${order.id}`).emit('estado_actualizado', order);
      io.to(`store_${order.store_id}`).emit('pedido_actualizado', order);
    }

    res.json({ message: `${result.count} pedidos actualizados`, updated: result.count, failed: [...deniedIds, ...invalidTransitionIds] });
  } catch (error) {
    console.error('Error en batch update:', error);
    res.status(500).json({ error: 'Error interno al actualizar pedidos' });
  }
};

const markOrderViewed = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const existing = await prisma.order.findUnique({
      where: { id: Number(id) },
      select: { id: true, store_id: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (user.role !== 'SUPERADMIN' && existing.store_id !== user.store_id) {
      return res.status(403).json({ error: 'No tienes permisos sobre este pedido' });
    }

    await prisma.order.update({
      where: { id: Number(id) },
      data: { viewed: true }
    });
    res.json({ message: 'Pedido marcado como visto' });
  } catch (error) {
    console.error('Error marking order viewed:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};


const reviewPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const user = req.user;

    const orderId = Number(id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'ID de orden inválido' });
    }

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true, user: true, items: { include: { product: true } } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (user.role !== 'SUPERADMIN' && (user.role !== 'ADMIN' || user.store_id !== existing.store_id)) {
      return res.status(403).json({ error: 'No autorizado para evaluar récipes de esta tienda' });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        prescription_status: status,
        prescription_notes: notes || null
      },
      include: { user: true, driver: true, items: { include: { product: true } } }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`client_${updated.user_id}`).emit('estado_actualizado', updated);
      io.to(`order_${updated.id}`).emit('estado_actualizado', updated);
      io.to(`store_${updated.store_id}`).emit('pedido_actualizado', updated);
    }

    return res.json({ message: 'Evaluación de récipe guardada exitosamente', order: updated });
  } catch (err) {
    console.error('Error al evaluar récipe:', err);
    return res.status(500).json({ error: 'Error al evaluar el récipe' });
  }
};

module.exports = { placeOrder, updateOrderStatus, deleteOrder, getMyOrders, getMyAddresses, rateOrder, getOrderById, cancelOrderClient, batchUpdateStatus, markOrderViewed };
