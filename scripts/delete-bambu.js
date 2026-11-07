const { runSSHCommand } = require('./vps-manager');

async function deleteBambu() {
  const nodeSnippet = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const store = await prisma.store.findUnique({
    where: { slug: 'bambu' }
  });

  if (!store) {
    console.log('Tienda bambu no encontrada (quizás ya fue borrada).');
    return;
  }

  console.log('Encontrada tienda Bambu con ID:', store.id);

  // Borrar productos, categorías, usuarios y órdenes asociados si existen
  await prisma.orderItem.deleteMany({ where: { order: { store_id: store.id } } });
  await prisma.order.deleteMany({ where: { store_id: store.id } });
  await prisma.product.deleteMany({ where: { store_id: store.id } });
  await prisma.category.deleteMany({ where: { store_id: store.id } });
  await prisma.subscriptionPayment.deleteMany({ where: { store_id: store.id } });
  await prisma.user.deleteMany({ where: { store_id: store.id } });
  await prisma.store.delete({ where: { id: store.id } });

  console.log('✅ Tienda Bambu y todos sus registros asociados borrados exitosamente.');
}

run().catch(console.error).finally(() => prisma.$disconnect());
`;

  const b64 = Buffer.from(nodeSnippet).toString('base64');
  const res = await runSSHCommand(`docker exec delivery_api node -e "$(echo '${b64}' | base64 -d)"`);
  console.log(res);
}

deleteBambu().catch(console.error);
