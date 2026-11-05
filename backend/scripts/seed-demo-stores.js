const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'TiendaFast2026!';

const DEMO_STORES = [
  {
    slug: 'demo-comida',
    name: 'Demo Comida Rápida',
    industry: 'RESTAURANT',
    theme_color: 'orange',
    latitude: 5.663,
    longitude: -67.624,
    bank_name: 'Banco de Venezuela',
    bank_code: '0102',
    bank_phone: '04141234567',
    bank_id_number: 'V-12345678',
    bank_holder: 'TiendaFast Demo',
    payment_note: 'Pago Móvil demo. Envía la referencia numérica de 4 a 10 dígitos.',
    admin: {
      username: 'admin_comida',
      name: 'Administrador Comida',
      email: 'admin_comida@demo.com',
    },
    driver: { name: 'Motorizado Comida', phone: '+584120000001', vehicle_plate: 'AB123CD' },
    categories: ['Hamburguesas', 'Perros Calientes', 'Acompañantes', 'Bebidas'],
    products: [
      { category: 'Hamburguesas', name: 'Hamburguesa clásica', price: 5.0, stock: 60, description: 'Carne 150 g, queso, lechuga, tomate y salsa de la casa.' },
      { category: 'Hamburguesas', name: 'Hamburguesa doble queso', price: 7.5, stock: 45, description: 'Doble carne, doble queso y papas al hilo.' },
      { category: 'Perros Calientes', name: 'Perro caliente especial', price: 3.0, stock: 80, description: 'Salchicha jumbo, papas trituradas, queso y salsas.' },
      { category: 'Acompañantes', name: 'Papas fritas', price: 2.5, stock: 90, description: 'Porción de papas fritas crocantes.' },
      { category: 'Bebidas', name: 'Refresco 350 ml', price: 1.5, stock: 120, description: 'Bebida fría de 350 ml.' },
      { category: 'Hamburguesas', name: 'Combo hamburguesa + papas + refresco', price: 8.5, stock: null, description: 'Hamburguesa clásica, papas fritas y refresco de 350 ml.', is_combo: true, components: [
        { name: 'Hamburguesa clásica', quantity: 1 },
        { name: 'Papas fritas', quantity: 1 },
        { name: 'Refresco 350 ml', quantity: 1 },
      ] },
    ],
  },
  {
    slug: 'demo-viveres',
    name: 'Demo Víveres',
    industry: 'SUPERMARKET',
    theme_color: 'emerald',
    latitude: 5.67,
    longitude: -67.64,
    bank_name: 'Mercantil',
    bank_code: '0105',
    bank_phone: '04141234567',
    bank_id_number: 'V-12345678',
    bank_holder: 'TiendaFast Demo',
    payment_note: 'Pago Móvil demo. Envía la referencia numérica de 4 a 10 dígitos.',
    admin: {
      username: 'admin_viveres',
      name: 'Administrador Víveres',
      email: 'admin_viveres@demo.com',
    },
    driver: { name: 'Motorizado Víveres', phone: '+584120000002', vehicle_plate: 'EF456GH' },
    categories: ['Harinas y Granos', 'Aceites y Salsas', 'Lácteos', 'Limpieza'],
    products: [
      { category: 'Harinas y Granos', name: 'Harina de maíz 1 kg', price: 1.2, stock: 100, description: 'Harina de maíz precocida para arepas.' },
      { category: 'Harinas y Granos', name: 'Arroz 1 kg', price: 1.5, stock: 80, description: 'Arroz blanco de grano largo.' },
      { category: 'Harinas y Granos', name: 'Pasta 500 g', price: 1.1, stock: 75, description: 'Pasta corta de trigo.' },
      { category: 'Aceites y Salsas', name: 'Aceite vegetal 1 L', price: 3.0, stock: 50, description: 'Aceite vegetal para cocinar.' },
      { category: 'Aceites y Salsas', name: 'Mayonesa 445 g', price: 2.5, stock: 40, description: 'Mayonesa cremosa.' },
      { category: 'Lácteos', name: 'Leche en polvo 400 g', price: 4.5, stock: 35, description: 'Leche en polvo instantánea.' },
      { category: 'Limpieza', name: 'Detergente 1 kg', price: 3.2, stock: 45, description: 'Detergente en polvo para ropa.' },
      { category: 'Limpieza', name: 'Papel higiénico 4 rollos', price: 2.8, stock: 60, description: 'Papel higiénico doble hoja.' },
    ],
  },
  {
    slug: 'demo-farmacia',
    name: 'Demo Farmacia',
    industry: 'PHARMACY',
    theme_color: 'blue',
    latitude: 5.6667,
    longitude: -67.6333,
    bank_name: 'Banesco',
    bank_code: '0134',
    bank_phone: '04141234567',
    bank_id_number: 'V-12345678',
    bank_holder: 'TiendaFast Demo',
    payment_note: 'Pago Móvil demo. Envía la referencia numérica de 4 a 10 dígitos.',
    admin: {
      username: 'admin_demo',
      name: 'Administrador Demo',
      email: 'admin@demo.com',
    },
    driver: { name: 'Motorizado Farmacia', phone: '+584120000003', vehicle_plate: 'IJ789KL' },
    categories: ['Analgésicos', 'Vitaminas', 'Cuidado Personal', 'Primeros Auxilios'],
    products: [
      { category: 'Analgésicos', name: 'Acetaminofén 500 mg (10 tabletas)', price: 2.5, stock: 70, description: 'Analgésico y antipirético de venta libre.' },
      { category: 'Analgésicos', name: 'Ibuprofeno 400 mg (10 tabletas)', price: 3.0, stock: 55, description: 'Antiinflamatorio no esteroideo.' },
      { category: 'Analgésicos', name: 'Suero oral', price: 1.5, stock: 80, description: 'Solución de rehidratación oral.' },
      { category: 'Vitaminas', name: 'Vitamina C 500 mg', price: 4.0, stock: 40, description: 'Suplemento de vitamina C.' },
      { category: 'Primeros Auxilios', name: 'Alcohol 70% 500 ml', price: 2.0, stock: 50, description: 'Alcohol etílico para desinfección.' },
      { category: 'Primeros Auxilios', name: 'Curitas (10 unidades)', price: 1.0, stock: 90, description: 'Apósitos adhesivos.' },
      { category: 'Cuidado Personal', name: 'Jabón antibacterial', price: 2.2, stock: 60, description: 'Jabón líquido antibacterial.' },
      { category: 'Cuidado Personal', name: 'Crema dental', price: 3.5, stock: 45, description: 'Crema dental con flúor.' },
    ],
  },
];

async function upsertStore(definition) {
  const storeData = {
    name: definition.name,
    industry: definition.industry,
    theme_color: definition.theme_color,
    latitude: definition.latitude,
    longitude: definition.longitude,
    is_active: true,
    currency: 'USD',
    usd_rate: 1,
    ves_rate: 893.2173,
    cop_rate: 4000,
    delivery_fee: 2,
    bank_name: definition.bank_name,
    bank_code: definition.bank_code,
    bank_phone: definition.bank_phone,
    bank_id_number: definition.bank_id_number,
    bank_holder: definition.bank_holder,
    payment_note: definition.payment_note,
  };

  return prisma.store.upsert({
    where: { slug: definition.slug },
    update: storeData,
    create: { slug: definition.slug, ...storeData },
  });
}

async function upsertAdmin(store, admin, passwordHash) {
  return prisma.user.upsert({
    where: { username: admin.username },
    update: {
      name: admin.name,
      email: admin.email,
      password: passwordHash,
      role: 'ADMIN',
      store_id: store.id,
      failed_attempts: 0,
      locked_until: null,
    },
    create: {
      name: admin.name,
      email: admin.email,
      username: admin.username,
      password: passwordHash,
      role: 'ADMIN',
      store_id: store.id,
    },
  });
}

async function upsertCategory(storeId, name) {
  const existing = await prisma.category.findFirst({ where: { store_id: storeId, name } });
  if (existing) return existing;
  return prisma.category.create({ data: { store_id: storeId, name } });
}

async function upsertProduct(storeId, categoryId, product) {
  const existing = await prisma.product.findFirst({ where: { store_id: storeId, name: product.name } });
  const data = {
    store_id: storeId,
    category_id: categoryId,
    name: product.name,
    price: product.price,
    description: product.description,
    image_url: `https://picsum.photos/seed/${encodeURIComponent(product.name)}/400/400`,
    stock: product.stock,
    is_available: true,
    is_combo: Boolean(product.is_combo),
  };

  if (existing) {
    return prisma.product.update({ where: { id: existing.id }, data });
  }
  return prisma.product.create({ data });
}

async function upsertDeliveryZones(store) {
  const zones = [
    { name: 'Puerto Ayacucho (5 km)', min_distance_km: 0, max_distance_km: 5, fee: 2 },
    { name: 'Puerto Ayacucho extendido (10 km)', min_distance_km: 5, max_distance_km: 10, fee: 3.5 },
  ];

  for (const zone of zones) {
    const existing = await prisma.deliveryZone.findFirst({ where: { store_id: store.id, name: zone.name } });
    const data = { ...zone, store_id: store.id, is_active: true };
    if (existing) {
      await prisma.deliveryZone.update({ where: { id: existing.id }, data });
    } else {
      await prisma.deliveryZone.create({ data });
    }
  }
}

async function upsertDriver(store, driver) {
  const existing = await prisma.driver.findFirst({ where: { store_id: store.id, phone: driver.phone } });
  const data = { ...driver, store_id: store.id, is_active: true };
  if (existing) {
    return prisma.driver.update({ where: { id: existing.id }, data });
  }
  return prisma.driver.create({ data });
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const superadmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {
      name: 'Super Administrador',
      email: 'superadmin@demo.com',
      password: passwordHash,
      role: 'SUPERADMIN',
      store_id: null,
      failed_attempts: 0,
      locked_until: null,
    },
    create: {
      name: 'Super Administrador',
      email: 'superadmin@demo.com',
      username: 'superadmin',
      password: passwordHash,
      role: 'SUPERADMIN',
    },
  });

  const summary = [];
  for (const definition of DEMO_STORES) {
    const store = await upsertStore(definition);
    const admin = await upsertAdmin(store, definition.admin, passwordHash);
    await upsertDeliveryZones(store);
    const driver = await upsertDriver(store, definition.driver);

    const categories = new Map();
    for (const categoryName of definition.categories) {
      categories.set(categoryName, await upsertCategory(store.id, categoryName));
    }

    const products = new Map();
    for (const product of definition.products) {
      const category = categories.get(product.category);
      const saved = await upsertProduct(store.id, category?.id, product);
      products.set(product.name, saved);
    }

    for (const product of definition.products.filter((item) => item.is_combo && item.components)) {
      const combo = products.get(product.name);
      await prisma.comboItem.deleteMany({ where: { combo_id: combo.id } });
      await prisma.comboItem.createMany({
        data: product.components.map((component) => ({
          combo_id: combo.id,
          product_id: products.get(component.name).id,
          quantity: component.quantity,
        })),
      });
    }

    summary.push({
      store: store.slug,
      admin: admin.username,
      driver: driver.name,
      categories: categories.size,
      products: products.size,
    });
  }

  console.log(JSON.stringify({
    password: DEMO_PASSWORD,
    superadmin: superadmin.username,
    stores: summary,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('DEMO_SEED_ERROR:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
