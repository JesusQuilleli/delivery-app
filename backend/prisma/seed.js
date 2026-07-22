const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const categoriesNames = [
  'Analgésicos',
  'Antibióticos',
  'Vitaminas',
  'Cuidado Personal',
  'Primeros Auxilios',
  'Antialérgicos',
  'Digestivos',
  'Infantil',
  'Dermatológicos',
  'Salud Femenina'
];

async function main() {
  console.log('Iniciando el seeding...');

  console.log("Limpiando base de datos...");
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.comboItem.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  // 1. Crear tienda Farmacia Ayacucho
  const store = await prisma.store.upsert({
    where: { slug: 'farmacia-ayacucho' },
    update: {},
    create: {
      name: 'Farmacia Ayacucho',
      slug: 'farmacia-ayacucho',
      is_active: true,
      currency: 'USD',
      usd_rate: 1.0,
      ves_rate: 36.5,
      cop_rate: 4000.0
    },
  });
  console.log(`Tienda creada/verificada: ${store.name}`);

  // Crear usuario administrador por defecto
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin_ayacucho' },
    update: {
      password: hashedPassword
    },
    create: {
      store_id: store.id,
      name: 'Administrador Principal',
      email: 'admin@ayacucho.com', 
      username: 'admin_ayacucho',
      password: hashedPassword,
      role: 'ADMIN',
    }
  });
  console.log(`Administrador creado: ${adminUser.username} / password123`);

  console.log("Creando categorías y productos...");
  for (let i = 0; i < categoriesNames.length; i++) {
    const category = await prisma.category.create({
      data: {
        name: categoriesNames[i],
        store_id: store.id
      }
    });

    const productsData = [];
    for (let j = 1; j <= 50; j++) {
      let baseUsdPrice = (Math.random() * 20 + 1);
      let finalPrice = baseUsdPrice;
      if (store.currency === 'VES') {
        finalPrice = baseUsdPrice * store.ves_rate;
      } else if (store.currency === 'COP') {
        finalPrice = baseUsdPrice * store.cop_rate;
      }

      productsData.push({
        store_id: store.id,
        category_id: category.id,
        name: `${category.name} Producto ${j}`,
        price: parseFloat(finalPrice.toFixed(2)),
        description: `Esta es la descripción detallada del producto ${j} de la categoría ${category.name}. Es un excelente producto de alta calidad.`,
        image_url: `https://picsum.photos/seed/${category.id}_${j}/400/400`,
        stock: Math.floor(Math.random() * 100) + 10,
        is_available: true,
        is_combo: false
      });
    }

    await prisma.product.createMany({
      data: productsData
    });
    console.log(`Categoría ${category.name} creada con 50 productos.`);
  }

  console.log('Seeding completado con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
