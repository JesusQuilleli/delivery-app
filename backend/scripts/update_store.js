const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.store.update({
    where: { slug: 'farmacia-ayacucho' },
    data: { latitude: 5.6667, longitude: -67.6333 }
  });
  console.log('Store coordinates updated!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
