const prisma = require('../prismaClient');
const { getBcvRate } = require('../services/ratesService');
const { resolveDeliveryFee } = require('../services/deliveryService');

const cleanOptionalText = (value, max = 120) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const text = String(value).trim();
  return text ? text.slice(0, max) : null;
};

const getStoreProducts = async (req, res) => {
  try {
    const { slug } = req.params;
    const { search, categoryId, page, limit } = req.query;
    
    // Buscar la tienda por slug
    const store = await prisma.store.findUnique({
      where: { slug },
      include: {
        categories: {
          orderBy: { id: 'asc' }
        }
      }
    });

    if (!store || !store.is_active) {
      return res.status(404).json({ error: 'Tienda no disponible' });
    }

    let whereClause = { 
      store_id: store.id,
      is_available: true 
    };

    if (categoryId && categoryId !== 'ALL') {
      whereClause.category_id = Number(categoryId);
    }

    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    let products = [];
    let totalPages = 1;
    let currentPage = 1;
    let totalProducts = 0;

    if (page && limit) {
      currentPage = Number(page);
      const parsedLimit = Number(limit);
      const skip = (currentPage - 1) * parsedLimit;
      
      const [count, paginatedProducts] = await prisma.$transaction([
        prisma.product.count({ where: whereClause }),
        prisma.product.findMany({
          where: whereClause,
          include: { category: true },
          skip,
          take: parsedLimit,
          orderBy: { id: 'desc' }
        })
      ]);
      
      products = paginatedProducts;
      totalProducts = count;
      totalPages = Math.ceil(count / parsedLimit);
    } else {
      products = await prisma.product.findMany({
        where: whereClause,
        include: { category: true },
        orderBy: { id: 'desc' }
      });
      totalProducts = products.length;
    }

    res.json({
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        latitude: store.latitude,
        longitude: store.longitude,
        currency: store.currency,
        usd_rate: store.usd_rate,
        ves_rate: store.ves_rate,
        cop_rate: store.cop_rate,
        delivery_fee: store.delivery_fee,
        bank_name: store.bank_name,
        bank_code: store.bank_code,
        bank_phone: store.bank_phone,
        bank_id_number: store.bank_id_number,
        bank_holder: store.bank_holder,
        payment_note: store.payment_note,
        industry: store.industry,
        theme_color: store.theme_color
      },
      products,
      categories: store.categories,
      pagination: {
        currentPage,
        totalPages,
        totalProducts
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const getStoreOrders = async (req, res) => {
  try {
    const { slug } = req.params;
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const orders = await prisma.order.findMany({
      where: {
        store_id: store.id,
        status: { in: ['AWAITING_PAYMENT', 'PENDING', 'ACCEPTED', 'DISPATCHED'] }
      },
      include: {
        items: { include: { product: true } },
        user: true,
        driver: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ storeId: store.id, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error cargando órdenes activas' });
  }
};

const getStoreHistory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { from, to } = req.query;
    
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    let dateFilter = {};
    if (from && to) {
      dateFilter = {
        gte: new Date(from),
        lte: new Date(to)
      };
    }

    const orders = await prisma.order.findMany({
      where: {
        store_id: store.id,
        status: { in: ['DELIVERED', 'CANCELLED'] },
        ...(from && to ? { createdAt: dateFilter } : {})
      },
      include: {
        items: { include: { product: true } },
        user: true,
        driver: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error cargando historial de órdenes' });
  }
};

const getStoreProductDetails = async (req, res) => {
  try {
    const { slug, productId } = req.params;
    
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store || !store.is_active) return res.status(404).json({ error: 'Tienda no disponible' });

    const product = await prisma.product.findFirst({
      where: {
        id: Number(productId),
        store_id: store.id,
        is_available: true
      },
      include: {
        category: true,
        comboItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    let relatedProducts = [];
    if (product.category_id) {
      relatedProducts = await prisma.product.findMany({
        where: {
          store_id: store.id,
          category_id: product.category_id,
          is_available: true,
          id: { not: product.id }
        },
        take: 4,
        include: {
          category: true
        }
      });
    } else {
      // Si no tiene categoría, traemos otros productos al azar (o los más recientes) de la misma tienda
      relatedProducts = await prisma.product.findMany({
        where: {
          store_id: store.id,
          is_available: true,
          id: { not: product.id }
        },
        take: 4,
        include: {
          category: true
        }
      });
    }

    res.json({ 
      product, 
      relatedProducts,
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        currency: store.currency,
        usd_rate: store.usd_rate,
        ves_rate: store.ves_rate,
        cop_rate: store.cop_rate,
        delivery_fee: store.delivery_fee,
        bank_name: store.bank_name,
        bank_code: store.bank_code,
        bank_phone: store.bank_phone,
        bank_id_number: store.bank_id_number,
        bank_holder: store.bank_holder,
        payment_note: store.payment_note
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error cargando detalles del producto' });
  }
};

const updateStoreSettings = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      name,
      latitude,
      longitude,
      currency,
      usd_rate,
      ves_rate,
      cop_rate,
      delivery_fee,
      bank_name,
      bank_code,
      bank_phone,
      bank_id_number,
      bank_holder,
      payment_note
    } = req.body;
    const user = req.user;

    // Verificar si el usuario es ADMIN
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No autorizado para editar configuración' });
    }

    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    let parsedDeliveryFee;
    if (delivery_fee !== undefined) {
      parsedDeliveryFee = Number(delivery_fee);
      if (!Number.isFinite(parsedDeliveryFee) || parsedDeliveryFee < 0) {
        return res.status(400).json({ error: 'La tarifa de delivery debe ser un número mayor o igual a 0.' });
      }
    }

    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: {
        name: name || undefined,
        latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
        longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
        currency: currency || undefined,
        usd_rate: usd_rate !== undefined ? parseFloat(usd_rate) : undefined,
        ves_rate: ves_rate !== undefined ? parseFloat(ves_rate) : undefined,
        cop_rate: cop_rate !== undefined ? parseFloat(cop_rate) : undefined,
        delivery_fee: parsedDeliveryFee,
        bank_name: cleanOptionalText(bank_name),
        bank_code: cleanOptionalText(bank_code, 20),
        bank_phone: cleanOptionalText(bank_phone, 30),
        bank_id_number: cleanOptionalText(bank_id_number, 30),
        bank_holder: cleanOptionalText(bank_holder),
        payment_note: cleanOptionalText(payment_note, 300),
      }
    });

    res.json({ message: 'Configuración actualizada exitosamente', store: updatedStore });
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    res.status(500).json({ error: 'Error interno actualizando configuración' });
  }
};

const syncStoreBcvRate = async (req, res) => {
  try {
    const { slug } = req.params;
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const force = req.body?.force === true;
    const rate = await getBcvRate({ force });

    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: { ves_rate: rate.ves_rate }
    });

    res.json({
      message: 'Tasa BCV actualizada',
      source: rate.source,
      ves_rate: rate.ves_rate,
      fetched_at: new Date(rate.fetched_at).toISOString(),
      cached: rate.cached,
      stale: rate.stale || false,
      store: updatedStore
    });
  } catch (error) {
    console.error('Error sincronizando tasa BCV:', error.message);
    res.status(502).json({ error: 'No se pudo obtener la tasa BCV. Ingresa la tasa manualmente.' });
  }
};

const normalizeZoneNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

const getStoreDeliveryZones = async (req, res) => {
  try {
    const store = await prisma.store.findUnique({ where: { slug: req.params.slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const zones = await prisma.deliveryZone.findMany({
      where: { store_id: store.id },
      orderBy: { min_distance_km: 'asc' }
    });

    res.json({ zones });
  } catch (error) {
    console.error('Error obteniendo zonas de delivery:', error);
    res.status(500).json({ error: 'Error interno obteniendo zonas de delivery' });
  }
};

const createStoreDeliveryZone = async (req, res) => {
  try {
    const store = await prisma.store.findUnique({ where: { slug: req.params.slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name) return res.status(400).json({ error: 'El nombre de la zona es obligatorio.' });

    const rawMin = normalizeZoneNumber(req.body.min_distance_km);
    const min = rawMin === null ? 0 : rawMin;
    const max = normalizeZoneNumber(req.body.max_distance_km);
    const fee = normalizeZoneNumber(req.body.fee);

    if (!Number.isFinite(min) || min < 0) {
      return res.status(400).json({ error: 'La distancia mínima debe ser un número mayor o igual a 0.' });
    }
    if (max !== null && (!Number.isFinite(max) || max < min)) {
      return res.status(400).json({ error: 'La distancia máxima debe ser mayor o igual a la mínima.' });
    }
    if (!Number.isFinite(fee) || fee < 0) {
      return res.status(400).json({ error: 'La tarifa debe ser un número mayor o igual a 0.' });
    }

    const zone = await prisma.deliveryZone.create({
      data: {
        store_id: store.id,
        name,
        min_distance_km: min,
        max_distance_km: max,
        fee,
        is_active: req.body.is_active === undefined ? true : Boolean(req.body.is_active)
      }
    });

    res.json({ message: 'Zona creada', zone });
  } catch (error) {
    console.error('Error creando zona de delivery:', error);
    res.status(500).json({ error: 'Error interno creando zona de delivery' });
  }
};

const updateStoreDeliveryZone = async (req, res) => {
  try {
    const store = await prisma.store.findUnique({ where: { slug: req.params.slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const zoneId = Number(req.params.zoneId);
    if (!Number.isInteger(zoneId)) return res.status(400).json({ error: 'Zona inválida' });

    const zone = await prisma.deliveryZone.findFirst({
      where: { id: zoneId, store_id: store.id }
    });
    if (!zone) return res.status(404).json({ error: 'Zona no encontrada' });

    const data = {};
    if (req.body.name !== undefined) {
      const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
      if (!name) return res.status(400).json({ error: 'El nombre de la zona es obligatorio.' });
      data.name = name;
    }
    if (req.body.min_distance_km !== undefined) {
      const min = normalizeZoneNumber(req.body.min_distance_km);
      if (!Number.isFinite(min) || min < 0) {
        return res.status(400).json({ error: 'La distancia mínima debe ser un número mayor o igual a 0.' });
      }
      data.min_distance_km = min;
    }
    if (req.body.max_distance_km !== undefined) {
      const max = normalizeZoneNumber(req.body.max_distance_km);
      if (max !== null && (!Number.isFinite(max) || max < 0)) {
        return res.status(400).json({ error: 'La distancia máxima debe ser un número mayor o igual a 0.' });
      }
      data.max_distance_km = max;
    }
    if (req.body.fee !== undefined) {
      const fee = normalizeZoneNumber(req.body.fee);
      if (!Number.isFinite(fee) || fee < 0) {
        return res.status(400).json({ error: 'La tarifa debe ser un número mayor o igual a 0.' });
      }
      data.fee = fee;
    }
    if (req.body.is_active !== undefined) {
      data.is_active = Boolean(req.body.is_active);
    }

    const nextMin = data.min_distance_km ?? Number(zone.min_distance_km);
    const nextMax = data.max_distance_km !== undefined
      ? data.max_distance_km
      : normalizeZoneNumber(zone.max_distance_km);
    if (nextMax !== null && nextMax < nextMin) {
      return res.status(400).json({ error: 'La distancia máxima debe ser mayor o igual a la mínima.' });
    }

    const updated = await prisma.deliveryZone.update({
      where: { id: zone.id },
      data
    });

    res.json({ message: 'Zona actualizada', zone: updated });
  } catch (error) {
    console.error('Error actualizando zona de delivery:', error);
    res.status(500).json({ error: 'Error interno actualizando zona de delivery' });
  }
};

const deleteStoreDeliveryZone = async (req, res) => {
  try {
    const store = await prisma.store.findUnique({ where: { slug: req.params.slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const zoneId = Number(req.params.zoneId);
    if (!Number.isInteger(zoneId)) return res.status(400).json({ error: 'Zona inválida' });

    const zone = await prisma.deliveryZone.findFirst({
      where: { id: zoneId, store_id: store.id }
    });
    if (!zone) return res.status(404).json({ error: 'Zona no encontrada' });

    await prisma.deliveryZone.delete({ where: { id: zone.id } });
    res.json({ message: 'Zona eliminada' });
  } catch (error) {
    console.error('Error eliminando zona de delivery:', error);
    res.status(500).json({ error: 'Error interno eliminando zona de delivery' });
  }
};

const quoteStoreDelivery = async (req, res) => {
  try {
    const store = await prisma.store.findUnique({ where: { slug: req.params.slug } });
    if (!store || !store.is_active) {
      return res.status(404).json({ error: 'Tienda no disponible' });
    }

    const quote = await resolveDeliveryFee({
      store,
      latitude: req.body?.latitude,
      longitude: req.body?.longitude
    });

    res.json({
      distance_km: quote.distance_km,
      estimated_minutes: quote.estimated_minutes,
      delivery_fee: quote.delivery_fee,
      zone: quote.zone ? { id: quote.zone.id, name: quote.zone.name } : null,
      currency: store.currency
    });
  } catch (error) {
    console.error('Error calculando cotización de delivery:', error);
    res.status(500).json({ error: 'Error interno calculando el delivery' });
  }
};

const getStoreAnalytics = async (req, res) => {
  try {
    const { slug } = req.params;
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    // Definir fechas base
    const now = new Date();
    
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Todas las ordenes entregadas
    const deliveredOrders = await prisma.order.findMany({
      where: {
        store_id: store.id,
        status: 'DELIVERED'
      },
      select: {
        total_amount: true,
        createdAt: true
      }
    });

    let todaySales = 0;
    let monthSales = 0;
    let totalSales = 0;
    let totalOrders = deliveredOrders.length;

    for (const order of deliveredOrders) {
      const amount = Number(order.total_amount);
      totalSales += amount;

      const orderDate = new Date(order.createdAt);
      if (orderDate >= startOfMonth) {
        monthSales += amount;
      }
      if (orderDate >= startOfToday) {
        todaySales += amount;
      }
    }

    res.json({
      todaySales,
      monthSales,
      totalSales,
      totalOrders,
      currency: store.currency
    });
  } catch (error) {
    console.error('Error cargando analytics:', error);
    res.status(500).json({ error: 'Error interno cargando analytics' });
  }
};

const getStoreCustomers = async (req, res) => {
  try {
    const { slug } = req.params;
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const customers = await prisma.user.findMany({
      where: {
        store_id: store.id,
        role: 'CLIENT'
      },
      include: {
        orders: {
          select: { id: true, createdAt: true }
        }
      },
      orderBy: { id: 'desc' }
    });

    const formattedCustomers = customers.map(c => {
      // Intentar obtener la fecha del primer pedido como fecha de "registro" aproximada
      let firstOrderDate = new Date();
      if (c.orders && c.orders.length > 0) {
        firstOrderDate = c.orders.reduce((oldest, current) => 
          (oldest.createdAt < current.createdAt) ? oldest : current
        ).createdAt;
      }

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        createdAt: firstOrderDate,
        total_orders: c.orders.length
      };
    });

    res.json(formattedCustomers);
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ error: 'Error al obtener lista de clientes' });
  }
};

const updateStoreCustomer = async (req, res) => {
  try {
    const { slug, id } = req.params;
    const { name, email, phone } = req.body;
    
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const user = await prisma.user.findFirst({
      where: {
        id: Number(id),
        store_id: store.id
      }
    });

    if (!user) return res.status(404).json({ error: 'Cliente no encontrado' });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || null,
        email: email || null,
        phone: phone || null
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({ error: 'Error al actualizar el cliente' });
  }
};

const deleteStoreCustomer = async (req, res) => {
  try {
    const { slug, id } = req.params;
    
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const user = await prisma.user.findFirst({
      where: {
        id: Number(id),
        store_id: store.id
      },
      include: {
        orders: true
      }
    });

    if (!user) return res.status(404).json({ error: 'Cliente no encontrado' });

    if (user.orders.length > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un cliente que ya tiene pedidos registrados. Puedes editar su información en su lugar.' });
    }

    await prisma.user.delete({
      where: { id: user.id }
    });

    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({ error: 'Error al eliminar el cliente' });
  }
};

const getStoreDrivers = async (req, res) => {
  try {
    const { slug } = req.params;
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const drivers = await prisma.driver.findMany({
      where: { store_id: store.id },
      orderBy: { id: 'desc' }
    });

    res.json({ drivers });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Error al cargar motorizados' });
  }
};

const createStoreDriver = async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, phone, vehicle_plate } = req.body;
    
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const newDriver = await prisma.driver.create({
      data: {
        store_id: store.id,
        name,
        phone,
        vehicle_plate,
        is_active: true
      }
    });

    res.json({ driver: newDriver });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Error al crear motorizado' });
  }
};

const updateStoreDriver = async (req, res) => {
  try {
    const { slug, id } = req.params;
    const { name, phone, vehicle_plate, is_active } = req.body;

    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const driver = await prisma.driver.findFirst({
      where: { id: Number(id), store_id: store.id }
    });

    if (!driver) return res.status(404).json({ error: 'Motorizado no encontrado' });

    const updatedDriver = await prisma.driver.update({
      where: { id: driver.id },
      data: { name, phone, vehicle_plate, is_active }
    });

    res.json({ driver: updatedDriver });
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ error: 'Error al actualizar motorizado' });
  }
};

const deleteStoreDriver = async (req, res) => {
  try {
    const { slug, id } = req.params;
    
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const driver = await prisma.driver.findFirst({
      where: { id: Number(id), store_id: store.id }
    });

    if (!driver) return res.status(404).json({ error: 'Motorizado no encontrado' });

    // En lugar de borrar físicamente, podríamos desactivarlo si tiene órdenes, o podemos borrar si no tiene.
    // Vamos a borrarlo físicamente.
    await prisma.driver.delete({ where: { id: driver.id } });

    res.json({ message: 'Motorizado eliminado' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ error: 'Error al eliminar motorizado (puede que tenga pedidos asignados)' });
  }
};

module.exports = { 
  getStoreProducts, 
  getStoreOrders, 
  getStoreHistory, 
  getStoreProductDetails, 
  updateStoreSettings, 
  syncStoreBcvRate,
  getStoreDeliveryZones,
  createStoreDeliveryZone,
  updateStoreDeliveryZone,
  deleteStoreDeliveryZone,
  quoteStoreDelivery,
  getStoreAnalytics, 
  getStoreCustomers, 
  updateStoreCustomer, 
  deleteStoreCustomer,
  getStoreDrivers,
  createStoreDriver,
  updateStoreDriver,
  deleteStoreDriver
};
