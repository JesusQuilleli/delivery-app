const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
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
    const { storeName, slug, adminUsername, adminPassword, adminPhone } = req.body;
    
    // Check if slug exists
    const existingStore = await prisma.store.findUnique({ where: { slug } });
    if (existingStore) return res.status(400).json({ error: 'El slug o URL ya está en uso' });
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username: adminUsername }, { phone: adminPhone }] }
    });
    if (existingUser) return res.status(400).json({ error: 'El usuario o teléfono ya existe' });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          name: storeName,
          slug,
          is_active: true
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
    const store = await prisma.store.findUnique({ where: { id: Number(id) } });
    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' });

    const updated = await prisma.store.update({
      where: { id: Number(id) },
      data: { is_active: !store.is_active }
    });

    res.json({ message: 'Estado actualizado', is_active: updated.is_active });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error actualizando estado' });
  }
};

module.exports = { getStores, createStore, toggleStoreStatus };
