const { PrismaClient } = require('@prisma/client');
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
  const store = await prisma.store.findFirst();
  if (!store) {
    console.log("No store found");
    return;
  }
  console.log(`Seeding data for store ${store.name} (id: ${store.id})`);

  // We should delete products, combos, and categories.
  // Order matters due to foreign keys.
  console.log("Deleting existing items...");
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.comboItem.deleteMany({});
  await prisma.product.deleteMany({ where: { store_id: store.id } });
  await prisma.category.deleteMany({ where: { store_id: store.id } });

  console.log("Creating categories and products...");
  
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
    console.log(`Created category ${category.name} with 50 products.`);
  }

  console.log("Seed completed successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
