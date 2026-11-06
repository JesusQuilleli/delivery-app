const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');

const getStores = async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      include: {
        users: {
          where: { role: 'ADMIN' },
          select: { username: true, name: true, phone: true }
        },
        _count: {
          select: { orders: true, products: true }
        }
      },
      orderBy: { id: 'desc' }
    });
    res.json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ error: 'Error obteniendo tiendas' });
  }
};

const createStore = async (req, res) => {
  try {
    const { storeName, slug, adminUsername, adminPassword, adminPhone, industry, theme_color } = req.body;
    
    if (!storeName || !slug || !adminUsername || !adminPassword || !adminPhone) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, slug, usuario, contraseña y teléfono son requeridos.' });
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ error: 'El slug solo puede contener letras minúsculas, números y guiones.' });
    }

    if (adminPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    // Check if slug exists
    const existingStore = await prisma.store.findUnique({ where: { slug } });
    if (existingStore) return res.status(400).json({ error: 'El slug o URL ya está en uso' });
    
    // El usuario de administración sigue siendo único global.
    // El teléfono ahora es único por tienda, y esta tienda es nueva.
    const existingUser = await prisma.user.findUnique({
      where: { username: adminUsername }
    });
    if (existingUser) return res.status(400).json({ error: 'El usuario ya existe' });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          name: storeName,
          slug,
          is_active: true,
          industry: industry || 'PHARMACY',
          theme_color: theme_color || 'blue'
        }
      });

      const admin = await tx.user.create({
        data: {
          store_id: store.id,
          username: adminUsername,
          password: hashedPassword,
          phone: adminPhone,
          name: 'Admin ' + storeName,
          role: 'ADMIN'
        }
      });

      return { store, admin };
    });

    res.json({ message: 'Tienda creada exitosamente', data: result });
  } catch (error) {
    console.error('Error creating store:', error);
    res.status(500).json({ error: 'Error creando la tienda y el administrador' });
  }
};

const toggleStoreStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const store = await prisma.store.findUnique({ where: { id: Number(id) } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const updated = await prisma.store.update({
      where: { id: Number(id) },
      data: { is_active: !store.is_active }
    });

    const actor = req.user?.username || req.user?.name || 'SUPERADMIN';
    const action = updated.is_active ? 'STORE_ACTIVATED' : 'STORE_DEACTIVATED';
    const auditRecord = {
      store_id: store.id,
      store_slug: store.slug,
      store_name: store.name,
      previous_status: store.is_active,
      new_status: updated.is_active,
      action,
      actor,
      reason: typeof reason === 'string' && reason.trim() ? reason.trim() : null,
      timestamp: new Date().toISOString()
    };

    console.log(`[AUDIT] ${action}: Tienda '${store.name}' (ID: ${store.id}, Slug: '${store.slug}') cambiada a ${updated.is_active ? 'ACTIVA' : 'INACTIVA'} por ${actor}. Razón: ${auditRecord.reason || 'No especificada'}. Fecha: ${auditRecord.timestamp}`);

    res.json({
      message: `Tienda ${updated.is_active ? 'activada' : 'desactivada'} exitosamente`,
      is_active: updated.is_active,
      audit: auditRecord
    });
  } catch (error) {
    console.error('Error actualizando estado de tienda:', error);
    res.status(500).json({ error: 'Error actualizando estado de tienda' });
  }
};

module.exports = { getStores, createStore, toggleStoreStatus };
