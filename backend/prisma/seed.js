const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el seeding...');

  // 0. Borrar todas las órdenes anteriores para limpieza
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  console.log('✅ Órdenes antiguas borradas exitosamente.');

  // 1. Crear tienda Farmacia Ayacucho
  const store = await prisma.store.upsert({
    where: { slug: 'farmacia-ayacucho' },
    update: {},
    create: {
      name: 'Farmacia Ayacucho',
      slug: 'farmacia-ayacucho',
      is_active: true,
    },
  });

  console.log(`Tienda creada/verificada: ${store.name}`);

  // Crear usuario administrador por defecto
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin_ayacucho' },
    update: {
      password: hashedPassword // Actualizamos si ya existe
    },
    create: {
      store_id: store.id,
      name: 'Administrador Principal',
      phone: '0000000000', // Teléfono dummy
      username: 'admin_ayacucho',
      password: hashedPassword,
      role: 'ADMIN',
    }
  });

  console.log(`Administrador creado: ${adminUser.username} / password123`);

  // 2. Crear 5 productos de prueba
  const products = [
    { name: "Paracetamol 500mg", price: 2.50, store_id: store.id, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80" }, // Pastillas genéricas blancas
    { name: "Ibuprofeno 400mg", price: 3.00, store_id: store.id, image_url: "https://images.unsplash.com/photo-1550572017-ed3476cb1c49?w=500&q=80" }, // Cápsulas rojas
    { name: "Vitamina C 1000mg", price: 5.00, store_id: store.id, image_url: "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=500&q=80" }, // Frasco de vitaminas
    { name: "Alcohol en gel 250ml", price: 1.50, store_id: store.id, image_url: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=500&q=80" }, // Botella dispensadora transparente
    { name: "Jarabe para la tos", price: 4.50, store_id: store.id, image_url: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&q=80" } // Botella de jarabe
  ];

  for (const p of products) {
    await prisma.product.create({
      data: p,
    });
  }

  console.log('5 Productos de prueba creados.');
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
